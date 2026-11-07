/**
 * ChronoCraft - Deterministic Natural Language Parser
 * Extracts dates, times, priority flags, hashtags, entry types,
 * and Time Blocks (e.g. "from 1pm to 3pm", "from 1pm30 to 2pm", "from 8:30am to 10:45am", "for 2h30m", or with <...>)
 */

import { EntryType, ParsedNLPResult, TimeBlockInfo } from "../types";

/**
 * Parses flexible time token string into hours (0-23) and minutes (0-59).
 * Handles:
 * - "1pm", "2pm", "11am"
 * - "8:30am", "10:45am", "3:30pm"
 * - "1pm30", "4pm45", "11am15"
 * - "14:30", "09:00"
 */
function parseTimeToken(
  token: string,
): { hours: number; minutes: number } | null {
  const clean = token.trim().toLowerCase().replace(/\s+/g, "");
  if (!clean) return null;

  // Pattern 1: 1pm30, 4pm45, 11am15 (hours + am/pm + minutes)
  const irregularMatch = clean.match(/^(\d{1,2})(am|pm)(\d{1,2})$/);
  if (irregularMatch) {
    let h = parseInt(irregularMatch[1], 10);
    const mer = irregularMatch[2];
    const m = parseInt(irregularMatch[3], 10);
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    return { hours: h, minutes: m };
  }

  // Pattern 2: 8:30am, 10:45am, 3:30pm, 14:30, 3pm, 9am
  const standardMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);
  if (standardMatch) {
    let h = parseInt(standardMatch[1], 10);
    const m = standardMatch[2] ? parseInt(standardMatch[2], 10) : 0;
    const mer = standardMatch[3];
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    return { hours: h, minutes: m };
  }

  return null;
}

export function parseNaturalLanguageInput(
  rawInput: string,
  defaultType: EntryType = "task",
  baseDate: Date = new Date(),
): ParsedNLPResult {
  let text = rawInput.trim();
  if (!text) {
    return {
      cleanTitle: "",
      type: defaultType,
      tags: [],
      rawMatches: [],
      isTimeBlockValid: true,
    };
  }

  const rawMatches: ParsedNLPResult["rawMatches"] = [];
  let parsedType: EntryType = defaultType;
  const parsedTags: string[] = [];

  let targetDate: Date | null = null;
  let hasSpecificTime = false;
  let targetHours = 9;
  let targetMinutes = 0;

  let timeBlockInfo: TimeBlockInfo | undefined = undefined;
  let isTimeBlockValid = true;
  let timeBlockError: string | undefined = undefined;

  // 1. Detect explicit type flags: /task, /log, /note, /event, /timeblock
  const typeRegex = /(?:^|\s)\/(task|log|note|event|timeblock)\b/i;
  const typeMatch = text.match(typeRegex);
  if (typeMatch) {
    parsedType = typeMatch[1].toLowerCase() as EntryType;
    rawMatches.push({
      label: `Type: ${parsedType.toUpperCase()}`,
      type: "type",
      raw: typeMatch[0].trim(),
    });
    text = text.replace(typeMatch[0], " ");
  }

  // 2. TIME BLOCK PARSING (supports both bare "from 1pm to 3pm", "from 1pm30 to 2pm", "for 2h30m", or with <...>)
  // First check if user typed brackets <...>
  const bracketRegex = /<([^>]+)>/i;
  const bracketMatch = text.match(bracketRegex);

  let blockCandidate = "";
  let matchedBlockSubstring = "";

  if (bracketMatch) {
    blockCandidate = bracketMatch[1].trim();
    matchedBlockSubstring = bracketMatch[0];
  } else {
    // Check bare patterns in text:
    // Pattern A: from X to Y (e.g. "from 1pm to 3pm", "from 1pm30 to 2pm", "from 8:30am to 10:45am")
    const bareRangeMatch = text.match(
      /\bfrom\s+([0-9:apm\s]+?)\s+to\s+([0-9:apm\s]+?)(?=\s+!|\s+#|$)/i,
    );
    // Pattern B: for X duration (e.g. "for 2h30m", "for 2 hours 30m", "for 1h", "for 45m")
    const bareDurationMatch = text.match(
      /\bfor\s+(\d+)\s*(?:h|hrs?|hours?)(?:\s*(\d+)?\s*(?:m|mins?|minutes?)?)?(?=\s+!|\s+#|$)/i,
    );
    const bareDurationMinOnlyMatch = text.match(
      /\bfor\s+(\d+)\s*(?:m|mins?|minutes?)(?=\s+!|\s+#|$)/i,
    );

    if (bareRangeMatch) {
      blockCandidate = bareRangeMatch[0].trim();
      matchedBlockSubstring = bareRangeMatch[0];
    } else if (bareDurationMatch) {
      blockCandidate = bareDurationMatch[0].trim();
      matchedBlockSubstring = bareDurationMatch[0];
    } else if (bareDurationMinOnlyMatch) {
      blockCandidate = bareDurationMinOnlyMatch[0].trim();
      matchedBlockSubstring = bareDurationMinOnlyMatch[0];
    }
  }

  if (blockCandidate) {
    const rangeMatch = blockCandidate.match(
      /^(?:from\s+)?([0-9:apm\s]+?)\s+to\s+([0-9:apm\s]+)$/i,
    );
    const durationMatch = blockCandidate.match(
      /^(?:for\s+)?(\d+)\s*(?:h|hrs?|hours?)(?:\s*(\d+)?\s*(?:m|mins?|minutes?)?)?$/i,
    );
    const durationMinOnlyMatch = blockCandidate.match(
      /^(?:for\s+)?(\d+)\s*(?:m|mins?|minutes?)$/i,
    );
    const singleTimeMatch = blockCandidate.match(/^(?:at\s+)?([0-9:apm\s]+)$/i);

    const nowBase = new Date(baseDate);

    if (rangeMatch) {
      const startTime = parseTimeToken(rangeMatch[1]);
      const endTime = parseTimeToken(rangeMatch[2]);

      if (startTime && endTime) {
        const startD = new Date(nowBase);
        startD.setHours(startTime.hours, startTime.minutes, 0, 0);

        const endD = new Date(nowBase);
        endD.setHours(endTime.hours, endTime.minutes, 0, 0);
        if (endD.getTime() <= startD.getTime()) {
          endD.setDate(endD.getDate() + 1);
        }

        const durationMinutes = Math.round(
          (endD.getTime() - startD.getTime()) / 60000,
        );
        timeBlockInfo = {
          startIso: startD.toISOString(),
          endIso: endD.toISOString(),
          durationMinutes,
          rawBracket: matchedBlockSubstring,
        };
        targetDate = startD;
        targetHours = startTime.hours;
        targetMinutes = startTime.minutes;
        hasSpecificTime = true;
        parsedType =
          parsedType === "task" && defaultType === "timeblock"
            ? "timeblock"
            : parsedType;

        const startDisp = `${startTime.hours % 12 || 12}:${startTime.minutes.toString().padStart(2, "0")} ${startTime.hours >= 12 ? "PM" : "AM"}`;
        const endDisp = `${endTime.hours % 12 || 12}:${endTime.minutes.toString().padStart(2, "0")} ${endTime.hours >= 12 ? "PM" : "AM"}`;
        rawMatches.push({
          label: `Block: ${startDisp} → ${endDisp}`,
          type: "time",
          raw: matchedBlockSubstring,
        });

        text = text.replace(matchedBlockSubstring, " ");
      }
    } else if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = durationMatch[2] ? parseInt(durationMatch[2], 10) : 0;
      const totalMinutes = hours * 60 + minutes;

      const startD = new Date(nowBase);
      startD.setMinutes(Math.ceil(startD.getMinutes() / 15) * 15, 0, 0);

      const endD = new Date(startD.getTime() + totalMinutes * 60000);
      timeBlockInfo = {
        startIso: startD.toISOString(),
        endIso: endD.toISOString(),
        durationMinutes: totalMinutes,
        rawBracket: matchedBlockSubstring,
      };
      targetDate = startD;
      targetHours = startD.getHours();
      targetMinutes = startD.getMinutes();
      hasSpecificTime = true;
      if (defaultType === "timeblock") parsedType = "timeblock";

      rawMatches.push({
        label: `Block: ${hours}h ${minutes ? minutes + "m" : ""} duration`,
        type: "time",
        raw: matchedBlockSubstring,
      });

      text = text.replace(matchedBlockSubstring, " ");
    } else if (durationMinOnlyMatch) {
      const minutes = parseInt(durationMinOnlyMatch[1], 10);
      const startD = new Date(nowBase);
      startD.setMinutes(Math.ceil(startD.getMinutes() / 15) * 15, 0, 0);
      const endD = new Date(startD.getTime() + minutes * 60000);

      timeBlockInfo = {
        startIso: startD.toISOString(),
        endIso: endD.toISOString(),
        durationMinutes: minutes,
        rawBracket: matchedBlockSubstring,
      };
      targetDate = startD;
      targetHours = startD.getHours();
      targetMinutes = startD.getMinutes();
      hasSpecificTime = true;
      if (defaultType === "timeblock") parsedType = "timeblock";

      rawMatches.push({
        label: `Block: ${minutes}m duration`,
        type: "time",
        raw: matchedBlockSubstring,
      });

      text = text.replace(matchedBlockSubstring, " ");
    } else if (
      singleTimeMatch &&
      (parsedType === "timeblock" || bracketMatch)
    ) {
      const timeParsed = parseTimeToken(singleTimeMatch[1]);
      if (timeParsed) {
        const startD = new Date(nowBase);
        startD.setHours(timeParsed.hours, timeParsed.minutes, 0, 0);
        const endD = new Date(startD.getTime() + 60 * 60000);
        timeBlockInfo = {
          startIso: startD.toISOString(),
          endIso: endD.toISOString(),
          durationMinutes: 60,
          rawBracket: matchedBlockSubstring,
        };
        targetDate = startD;
        targetHours = timeParsed.hours;
        targetMinutes = timeParsed.minutes;
        hasSpecificTime = true;

        rawMatches.push({
          label: `Block: Starts at ${singleTimeMatch[1].trim()} (1h)`,
          type: "time",
          raw: matchedBlockSubstring,
        });

        text = text.replace(matchedBlockSubstring, " ");
      }
    }
  }

  // If entry type is explicitly timeblock, validate whether time info was found
  if (parsedType === "timeblock") {
    if (!timeBlockInfo) {
      isTimeBlockValid = false;
      timeBlockError =
        'Include a range like "from 1pm to 3pm", "from 1pm30 to 2pm", or "for 2h30m"';
    } else {
      isTimeBlockValid = true;
    }
  }

  // 3. Detect Hashtags: #tag
  const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\-]+)/g;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRegex.exec(text)) !== null) {
    const tag = tagMatch[1].toLowerCase();
    if (!parsedTags.includes(tag)) {
      parsedTags.push(tag);
      rawMatches.push({
        label: `#${tag}`,
        type: "tag",
        raw: tagMatch[0].trim(),
      });
    }
  }
  text = text.replace(tagRegex, " ");

  // 4a. Relative duration: "in 30 mins", "in 30 minutes", "in 2 hrs", "in 90 min"
  //     Anchors "in X mins from now" to baseDate + duration.
  const relativeDurationRegex =
    /\bin\s+(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)\b/i;
  const relativeMatch = text.match(relativeDurationRegex);

  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();
    const isHours = unit.startsWith("h");
    const offsetMs = amount * (isHours ? 3600_000 : 60_000);

    const anchor = new Date(baseDate.getTime() + offsetMs);
    targetDate = anchor;
    targetHours = anchor.getHours();
    targetMinutes = anchor.getMinutes();
    hasSpecificTime = true;

    const label = isHours
      ? `${amount} hour${amount === 1 ? "" : "s"} from now`
      : `${amount} min${amount === 1 ? "" : "s"} from now`;
    rawMatches.push({
      label,
      type: "time",
      raw: relativeMatch[0].trim(),
    });
    text = text.replace(relativeMatch[0], " ");
  }

  // 4. Standard Time Detection (if not consumed by Time Block)
  if (!timeBlockInfo) {
    const timeRegex =
      /(?:(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|(?:at\s+)(\d{1,2}):(\d{2})\b|(?:at\s+)(noon|midnight)\b|(?:at\s+)(\d{1,2})(am|pm)(\d{1,2})\b)/i;
    const timeMatch = text.match(timeRegex);

    if (timeMatch) {
      hasSpecificTime = true;
      const rawTimeStr = timeMatch[0].trim();

      if (timeMatch[6]) {
        const word = timeMatch[6].toLowerCase();
        targetHours = word === "noon" ? 12 : 0;
        targetMinutes = 0;
        rawMatches.push({
          label: word === "noon" ? "12:00 PM" : "12:00 AM",
          type: "time",
          raw: rawTimeStr,
        });
      } else if (timeMatch[7] && timeMatch[8] && timeMatch[9]) {
        // e.g. at 1pm30
        let h = parseInt(timeMatch[7], 10);
        const mer = timeMatch[8].toLowerCase();
        const m = parseInt(timeMatch[9], 10);
        if (mer === "pm" && h < 12) h += 12;
        if (mer === "am" && h === 12) h = 0;
        targetHours = h;
        targetMinutes = m;
        const displayHours = h % 12 || 12;
        const displayMin = m.toString().padStart(2, "0");
        rawMatches.push({
          label: `${displayHours}:${displayMin} ${mer.toUpperCase()}`,
          type: "time",
          raw: rawTimeStr,
        });
      } else if (timeMatch[4] && timeMatch[5]) {
        targetHours = parseInt(timeMatch[4], 10);
        targetMinutes = parseInt(timeMatch[5], 10);
        const ampm = targetHours >= 12 ? "PM" : "AM";
        const displayHours = targetHours % 12 || 12;
        const displayMin = targetMinutes.toString().padStart(2, "0");
        rawMatches.push({
          label: `${displayHours}:${displayMin} ${ampm}`,
          type: "time",
          raw: rawTimeStr,
        });
      } else if (timeMatch[1]) {
        let h = parseInt(timeMatch[1], 10);
        const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const mer = (timeMatch[3] || "").toLowerCase();
        if (mer === "pm" && h < 12) h += 12;
        if (mer === "am" && h === 12) h = 0;
        targetHours = h;
        targetMinutes = m;
        const displayHours = h % 12 || 12;
        const displayMin = m.toString().padStart(2, "0");
        rawMatches.push({
          label: `${displayHours}:${displayMin} ${mer.toUpperCase()}`,
          type: "time",
          raw: rawTimeStr,
        });
      }

      text = text.replace(timeMatch[0], " ");
    }
  }

  // 5. Detect Relative & Explicit Dates
  const todayRegex = /\b(today|tonight)\b/i;
  const tomorrowRegex = /\b(tomorrow|tmrw)\b/i;
  const inDaysRegex = /\bin\s+(\d+)\s+(day|days|week|weeks)\b/i;
  const dayOfWeekRegex =
    /\b(?:(next|this|on)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const explicitDateRegex = /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/;
  const monthNameRegex =
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;

  const todayMatch = text.match(todayRegex);
  const tomorrowMatch = text.match(tomorrowRegex);
  const inDaysMatch = text.match(inDaysRegex);
  const dayOfWeekMatch = text.match(dayOfWeekRegex);
  const explicitMatch = text.match(explicitDateRegex);
  const monthNameMatch = text.match(monthNameRegex);

  if (todayMatch) {
    targetDate = new Date(baseDate);
    rawMatches.push({
      label: todayMatch[1].toLowerCase() === "tonight" ? "Tonight" : "Today",
      type: "date",
      raw: todayMatch[0].trim(),
    });
    if (todayMatch[1].toLowerCase() === "tonight" && !hasSpecificTime) {
      targetHours = 20;
      hasSpecificTime = true;
    }
    text = text.replace(todayMatch[0], " ");
  } else if (tomorrowMatch) {
    targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + 1);
    rawMatches.push({
      label: "Tomorrow",
      type: "date",
      raw: tomorrowMatch[0].trim(),
    });
    text = text.replace(tomorrowMatch[0], " ");
  } else if (inDaysMatch) {
    const amount = parseInt(inDaysMatch[1], 10);
    const unit = inDaysMatch[2].toLowerCase();
    targetDate = new Date(baseDate);
    if (unit.startsWith("week")) {
      targetDate.setDate(targetDate.getDate() + amount * 7);
      rawMatches.push({
        label: `In ${amount} week${amount > 1 ? "s" : ""}`,
        type: "date",
        raw: inDaysMatch[0].trim(),
      });
    } else {
      targetDate.setDate(targetDate.getDate() + amount);
      rawMatches.push({
        label: `In ${amount} day${amount > 1 ? "s" : ""}`,
        type: "date",
        raw: inDaysMatch[0].trim(),
      });
    }
    text = text.replace(inDaysMatch[0], " ");
  } else if (dayOfWeekMatch) {
    const daysMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const targetDayIndex = daysMap[dayOfWeekMatch[2].toLowerCase()];
    const currentDayIndex = baseDate.getDay();
    let diff = targetDayIndex - currentDayIndex;
    if (diff <= 0) diff += 7;
    if (dayOfWeekMatch[1]?.toLowerCase() === "next") diff += 7;

    targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + diff);

    const dayName =
      dayOfWeekMatch[2].charAt(0).toUpperCase() +
      dayOfWeekMatch[2].slice(1).toLowerCase();
    rawMatches.push({
      label: `Next ${dayName}`,
      type: "date",
      raw: dayOfWeekMatch[0].trim(),
    });
    text = text.replace(dayOfWeekMatch[0], " ");
  } else if (explicitMatch) {
    const d = parseInt(explicitMatch[1], 10);
    const m = parseInt(explicitMatch[2], 10) - 1;
    const y = explicitMatch[3]
      ? parseInt(explicitMatch[3], 10)
      : baseDate.getFullYear();
    targetDate = new Date(y, m, d);
    rawMatches.push({
      label: `${d.toString().padStart(2, "0")}/${(m + 1).toString().padStart(2, "0")}`,
      type: "date",
      raw: explicitMatch[0].trim(),
    });
    text = text.replace(explicitMatch[0], " ");
  } else if (monthNameMatch) {
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const monthIndex = months.indexOf(
      monthNameMatch[1].toLowerCase().slice(0, 3),
    );
    const day = parseInt(monthNameMatch[2], 10);
    if (monthIndex !== -1) {
      targetDate = new Date(baseDate.getFullYear(), monthIndex, day);
      if (targetDate.getTime() < baseDate.getTime() - 86400000 * 30) {
        targetDate.setFullYear(baseDate.getFullYear() + 1);
      }
      rawMatches.push({
        label: `${monthNameMatch[1]} ${day}`,
        type: "date",
        raw: monthNameMatch[0].trim(),
      });
      text = text.replace(monthNameMatch[0], " ");
    }
  }

  if (hasSpecificTime && !targetDate) {
    targetDate = new Date(baseDate);
  }

  let scheduledAt: string | undefined = undefined;
  let scheduledDisplay: string | undefined = undefined;

  if (targetDate) {
    targetDate.setHours(targetHours, targetMinutes, 0, 0);
    scheduledAt = targetDate.toISOString();

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
    };

    const isToday = targetDate.toDateString() === baseDate.toDateString();
    const tomorrowCheck = new Date(baseDate);
    tomorrowCheck.setDate(tomorrowCheck.getDate() + 1);
    const isTomorrow =
      targetDate.toDateString() === tomorrowCheck.toDateString();

    let datePrefix = targetDate.toLocaleDateString(undefined, dateOptions);
    if (isToday) datePrefix = "Today";
    else if (isTomorrow) datePrefix = "Tomorrow";

    if (hasSpecificTime) {
      scheduledDisplay = `${datePrefix} at ${targetDate.toLocaleTimeString(undefined, timeOptions)}`;
    } else {
      scheduledDisplay = datePrefix;
    }
  }

  const cleanTitle = text.replace(/\s+/g, " ").trim();

  return {
    cleanTitle: cleanTitle || rawInput.trim(),
    type: parsedType,
    scheduledAt,
    scheduledDisplay,
    tags: parsedTags,
    timeBlock: timeBlockInfo,
    isTimeBlockValid,
    timeBlockError,
    rawMatches,
  };
}
