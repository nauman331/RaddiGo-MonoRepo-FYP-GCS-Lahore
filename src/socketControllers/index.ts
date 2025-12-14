import { setupRidesController } from "./rides.controller";
import { setupChatController } from "./chat.controller";
import { setupNotificationController } from "./notification.controller";

export const setupAllSocketControllers = () => {
    setupRidesController();
    setupChatController();
    setupNotificationController();
    console.log("✓ All socket controllers initialized");
};
