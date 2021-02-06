import dotenv from "dotenv";
import { client } from "./client";
import { removeConfig } from "./config";
import { handleMessage } from "./handleMessage";
import { log } from "./log";

dotenv.config();

client.once("ready", ready);
client.once("reconnecting", () => log("Reconnecting", "Server"));
client.once("disconnect", () => log("Disconnect", "Server"));
client.on("error", (e) => console.error("Error", e));
client.on("message", handleMessage);

client.on("guildDelete", async (guild) => {
    await removeConfig(guild.id);
});

client.login(process.env.DISCORD_TOKEN);

function ready() {
    client.user!.setActivity({
        name: "WTRL on Zwift",
        type: "WATCHING",
    });

    log(`Member of ${client.guilds.cache.size} server(s)`, "Server");
    client.guilds.cache.forEach((guild) => {
        log(`${guild.id}: ${guild.name}`, "Server");
    });

    log("Ready", "Server");
}
