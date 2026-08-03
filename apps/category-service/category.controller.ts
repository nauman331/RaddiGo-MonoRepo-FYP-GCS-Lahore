import pool, { redis } from '../../packages/db';
import type { ICategory } from "../../packages/types/index";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const createCategory = async (req: Request) => {
    try {
        const body = await req.json().catch(() => ({})) as any;

        const nameEng = String(body.nameEng || body.name || body.name_eng || "").trim();
        const nameUrdu = String(body.nameUrdu || body.name_urdu || nameEng).trim();
        const todayPrice = Number(body.todayPrice ?? body.today_price ?? body.price ?? body.rate);
        const categoryLogo = body.categoryLogo || body.category_logo || body.logo || null;

        if (!nameEng || isNaN(todayPrice) || todayPrice < 0) {
            return Response.json({ message: "Category name and valid rate/price are required" }, { status: 400 });
        }

        // Check duplicate name
        const [existingCategoryRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM categories WHERE LOWER(nameEng) = LOWER(?)",
            [nameEng]
        );
        const existingCategory = (existingCategoryRows as unknown as ICategory[])[0];
        if (existingCategory) {
            return Response.json({ message: "Category already exists" }, { status: 400 });
        }

        // Insert into MySQL DB
        const [insertResult] = await pool.execute<ResultSetHeader>(
            "INSERT INTO categories (nameEng, nameUrdu, todayPrice, categoryLogo) VALUES (?, ?, ?, ?)",
            [nameEng, nameUrdu, todayPrice, categoryLogo]
        );

        // Safe Redis cache clear
        try {
            await redis.del("categories:list");
            const keys = await redis.keys("categories:list:page:*");
            if (keys && keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (redisErr: any) {
            console.warn("[Category] Redis cache clear warning:", redisErr?.message);
        }

        return Response.json({
            message: "Category created successfully",
            category: {
                id: insertResult.insertId,
                nameEng,
                nameUrdu,
                todayPrice,
                categoryLogo
            }
        }, { status: 201 });
    } catch (error: any) {
        console.error("[createCategory] Error:", error);
        return Response.json({ message: error.message || "Failed to create category" }, { status: 500 });
    }
};

export const deleteCategory = async (req: Request) => {
    try {
        const body = await req.json().catch(() => ({})) as { id?: number };
        const url = new URL(req.url);
        const id = Number(body.id || url.searchParams.get("id"));

        if (!id || isNaN(id)) {
            return Response.json({ message: "Category ID is required" }, { status: 400 });
        }

        const [existingCategoryRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM categories WHERE id = ?",
            [id]
        );
        const existingCategory = (existingCategoryRows as unknown as ICategory[])[0];
        if (!existingCategory) {
            return Response.json({ message: "Category not found" }, { status: 404 });
        }

        await pool.execute(
            "DELETE FROM categories WHERE id = ?",
            [id]
        );

        // Safe Redis cache clear
        try {
            await redis.del("categories:list");
            const keys = await redis.keys("categories:list:page:*");
            if (keys && keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (redisErr: any) {
            console.warn("[Category] Redis cache clear warning:", redisErr?.message);
        }

        return Response.json({ message: "Category deleted successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("[deleteCategory] Error:", error);
        return Response.json({ message: error.message || "Failed to delete category" }, { status: 500 });
    }
};

export const getCategories = async (req: Request): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
        const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "10"));
        const offset = (page - 1) * limit;

        const cacheKey = `categories:list:page:${page}:limit:${limit}`;

        try {
            const cachedCategories = await redis.get(cacheKey);
            if (cachedCategories) {
                return Response.json(JSON.parse(cachedCategories), { status: 200 });
            }
        } catch (redisErr: any) {
            console.warn("[Category] Redis cache read warning:", redisErr?.message);
        }

        const [countRows] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) as count FROM categories"
        );
        const count = (countRows as any)[0]?.count || 0;

        const [categoriesRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM categories ORDER BY id DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );
        const categories = categoriesRows as unknown as ICategory[];

        const response = {
            categories,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };

        try {
            await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);
        } catch (redisErr: any) {
            console.warn("[Category] Redis cache write warning:", redisErr?.message);
        }

        return Response.json(response, { status: 200 });
    } catch (error: any) {
        console.error("[getCategories] Error:", error);
        return Response.json({ message: error.message || "Failed to fetch categories" }, { status: 500 });
    }
};