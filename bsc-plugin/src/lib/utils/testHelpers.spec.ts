
/**
 * Trim leading whitespace for every line (to make test writing cleaner
 */
export function trimLeading(text: string) {
    if (!text) {
        return text;
    }
    const lines = text.split(/\r?\n/);

    //skip leading empty lines
    while (lines[0]?.trim().length === 0) {
        lines.splice(0, 1);
    }

    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trimLeft();
    }

    //apply the trim to each line
    return lines.join('\n');
}
