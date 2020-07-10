export function toMessagesMap(
    messages: Record<string, string>,
    keyHashFn: (key: string) => string
) {
    return Object.keys(messages).reduce(
        (prev, key) => ({
            ...prev,
            [key]: `${key}_${keyHashFn(key)}`,
        }),
        {}
    );
}

export function mapMessageKeys(
    messages: Record<string, string>,
    messagesMap: Record<string, string>
) {
    return Object.keys(messages).reduce(
        (prev, key) => ({
            ...prev,
            [messagesMap[key]]: messages[key],
        }),
        {}
    );
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}
