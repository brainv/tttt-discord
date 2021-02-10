import { Message } from "discord.js";
import { client } from "../../discord";
import { log } from "../../services/log";
import { stopTimer } from "../../services/timer";
import { EMOJI_SUCCESS } from "../../util/emojis";

export async function stop(message: Message): Promise<void> {
    await message.react(EMOJI_SUCCESS);

    const guildId = message.guild!.id;
    const connection = client.voice?.connections.find((c) => c.channel.guild.id === guildId);

    if (connection === undefined) {
        return;
    }

    log("Stopping timer", `G:${connection.channel.guild.id}`);

    await stopTimer(guildId);

    log(`Connected to VC:${connection.channel.id}`, `G:${connection.channel.guild.id}`);
    connection.disconnect();
}
