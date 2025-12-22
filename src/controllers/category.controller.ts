import mysql from "../config/sqldb";
import type { ICategory } from "../types";
import redis from "../config/redis";

export const createCategory = async (req: Request) => {
    try {
        const { name, categoryLogo } = await req.json() as ICategory;
        if (!name) {
            return Response.json({ message: "Category name is required" }, { status: 400 });
        }
        const [existingCategory] = await mysql<ICategory[]>`
            SELECT * FROM categories WHERE name = ${name}
        `;
        if (existingCategory) {
            return Response.json({ message: "Category already exists" }, { status: 400 });
        }
        await mysql`
            INSERT INTO categories (name, categoryLogo)
            VALUES (${name}, ${categoryLogo || null})
        `;
        await redis.del("categories:list");
        const keys = await redis.keys("categories:list:page:*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        return Response.json({ message: "Category created successfully" }, { status: 201 });
    } catch (error) {
        return Response.json({ message: "Failed to create category" }, { status: 500 });
    }
}

export const deleteCategory = async (req: Request) => {
    try {
        const { id } = await req.json() as { id: number };
        if (!id) {
            return Response.json({ message: "Category ID is required" }, { status: 400 });
        }
        const [existingCategory] = await mysql<ICategory[]>`
            SELECT * FROM categories WHERE id = ${id}
        `;
        if (!existingCategory) {
            return Response.json({ message: "Category not found" }, { status: 404 });
        }
        await mysql`
            DELETE FROM categories WHERE id = ${id}
        `;
        await redis.del("categories:list");
        const keys = await redis.keys("categories:list:page:*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        return Response.json({ message: "Category deleted successfully" }, { status: 200 });
    } catch (error) {
        return Response.json({ message: "Failed to delete category" }, { status: 500 });
    }
}

export const getCategories = async (req: Request): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        if (page < 1) {
            return Response.json({ message: "Page number must be greater than 0" }, { status: 400 });
        }
        const offset = (page - 1) * limit;
        const cacheKey = `categories:list:page:${page}:limit:${limit}`;
        const cachedCategories = await redis.get(cacheKey);
        if (cachedCategories) {
            return Response.json({ categories: JSON.parse(cachedCategories) }, { status: 200 });
        }
        const [{ count }] = await mysql`
            SELECT COUNT(*) as count FROM categories
        `;
        const categories = await mysql<ICategory[]>`
            SELECT * FROM categories
            ORDER BY id DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const response = {
            categories,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        }
        await redis.set(cacheKey, JSON.stringify(response));
        return Response.json(response, { status: 200 });
    } catch (error) {
        return Response.json({ message: "Failed to fetch categories" }, { status: 500 });
    }
}