import { MessageEmbed, TextChannel } from "discord.js";
import { client } from "../discord";
import { getConfig } from "../persistence/config";
import { getAllTimers, getTimer, setTimer } from "../persistence/timer";
import type { Config, Timer } from "../types";
import { EMOJI_PLUS10, EMOJI_SKIP, EMOJI_TOAST } from "../util/emojis";
import { getNextAthleteIndex } from "./timer";

export function createStatusMessage(config: Config, timer: Timer): MessageEmbed {
    const currentAthlete = config.athletes[timer.currentAthleteIndex];

    let messageEmbed: MessageEmbed;
    if (timer.started) {
        const nextAthlete = config.athletes[getNextAthleteIndex(config, timer)];

        messageEmbed = new MessageEmbed()
            .setTitle(`${currentAthlete.name} (${currentAthlete.time}s)`)
            .addField("Next athlete", `${nextAthlete.name} (${nextAthlete.time}s)`)
            .setFooter(
                `Click ${EMOJI_PLUS10} to add 10 seconds and ${EMOJI_SKIP} to go to the next rider. Click ${EMOJI_TOAST} when you are dead.`
            );
    } else {
        messageEmbed = new MessageEmbed()
            .setTitle("Waiting for the start...")
            .addField("First athlete", `${currentAthlete.name} (${currentAthlete.time}s)`)
            .setFooter(
                `Click ${EMOJI_PLUS10} to add 10 seconds and ${EMOJI_SKIP} to start. Click ${EMOJI_TOAST} when you are dead.`
            );
    }

    return messageEmbed.addField(
        "Toasted athletes",
        timer.disabledAthletes.length === 0
            ? "*Everybody's still fresh*"
            : config.athletes
                  .filter((_, ai) => timer.disabledAthletes.includes(ai))
                  .map((a) => `• ${a.name}`)
                  .join("\n")
    );
}

export async function sendStatusMessage(channel: TextChannel) {
    const [config, timer] = await Promise.all([getConfig(channel.guild.id), getTimer(channel.guild.id)]);
    if (timer === undefined) {
        return;
    }

    const message = await channel.send(createStatusMessage(config, timer));
    message.react(EMOJI_PLUS10);
    message.react(EMOJI_SKIP);
    message.react(EMOJI_TOAST);

    await setTimer({
        ...timer,
        status: {
            channelId: channel.id,
            messageId: message.id,
        },
    });
}

export async function updateStatusMessage(guildId: string) {
    const [config, timer] = await Promise.all([getConfig(guildId), getTimer(guildId)]);
    if (timer === undefined) {
        return;
    }

    if (timer.status === undefined) {
        return;
    }

    const channel = (await client.channels.fetch(timer.status.channelId)) as TextChannel;
    const message = await channel.messages.fetch(timer.status.messageId);
    await message.edit(createStatusMessage(config, timer));
}

export async function deleteStatusMessage(guildId: string) {
    const timer = await getTimer(guildId);
    if (timer === undefined) {
        return;
    }

    if (timer.status === undefined) {
        return;
    }

    const channel = (await client.channels.fetch(timer.status.channelId)) as TextChannel;
    const message = await channel.messages.fetch(timer.status.messageId);
    await message.delete();
}

/**
 * Required to receive the `messageReactionAdd` event
 */
export async function fetchStatusMessages() {
    const timers = await getAllTimers();

    for (const timer of timers) {
        if (timer?.status) {
            const channel = (await client.channels.fetch(timer.status.channelId)) as TextChannel;
            channel.messages.fetch(timer.status.messageId);
        }
    }
}
