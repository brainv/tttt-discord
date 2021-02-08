import { VoiceChannel, VoiceConnection } from "discord.js";
import { saveConfig } from "../config";
import { client } from "../discord";
import { log } from "../services/log";
import { Config } from "../types";

export async function getVoiceConnection(
    config: Config,
    userVoiceChannel?: VoiceChannel
): Promise<VoiceConnection | undefined> {
    let connection: VoiceConnection | undefined = undefined;

    connection = client.voice?.connections.find((c) => c.channel.guild.id === config.guildId);

    if (connection === undefined) {
        const voiceChannel = userVoiceChannel;
        if (voiceChannel) {
            connection = await voiceChannel.join();
            log("Connect", `VC:${connection.channel.id}`);
        }
    }

    if (connection === undefined) {
        if (config.voiceChannelId) {
            const channel = await client.channels.fetch(config.voiceChannelId);
            if (channel.type === "voice") {
                const voiceChannel = channel as VoiceChannel;
                connection = await voiceChannel.join();
                log("Connect", `VC:${connection.channel.id}`);
            }
        }
    }
    if (connection === undefined) {
        const guild = await client.guilds.fetch(config.guildId);
        const voiceChannels = guild.channels.cache.filter((channel) => channel.type === "voice");
        if (voiceChannels.size === 1) {
            const voiceChannel = voiceChannels.first()! as VoiceChannel;
            connection = await voiceChannel.join();
            log("Connect", `VC:${connection.channel.id}`);
        }
    }

    if (config.voiceChannelId !== connection?.channel.id) {
        saveConfig({
            ...config,
            voiceChannelId: connection?.channel.id,
        });
    }

    return connection;
}
