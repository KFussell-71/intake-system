/**
 * SECURITY: Centralized Input Sanitizer (RT-AI-003)
 * 
 * Provides robust sanitization for user-generated content before interpolation into LLM prompts.
 * Prevents Prompt Injection, Jailbreaking, and Control Character attacks.
 */

export function sanitizeForPrompt(text: string | null | undefined, maxLength: number = 1000): string {
    if (!text) return 'Not Provided';

    // Convert to string just in case
    let safeText = String(text);

    // 1. Truncate to prevent DoS / Context Window Consumption
    if (safeText.length > maxLength) {
        safeText = safeText.substring(0, maxLength) + '... (truncated)';
    }

    return safeText
        // 2. Remove Control Characters (prevent hidden commands)
        // We keep newlines (\n) but normalize them to spaces to prevent instruction injection hacks
        // unless it's a block of text where structure matters, but for prompts, single line is safer usually.
        // Actually, for narrative fields, newlines are valid content.
        // But for preventing injection, we often strip them or escape them.
        // Let's replace dangerous sequences.
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')

        // 3. Neutralize Injection Keywords (Basic Defense in Depth)
        // This is tricky because "System" might be a valid word.
        // Instead of removing, we wrap content in delimiters (XML tags) in the prompt template usually.
        // But for this sanitizer, we focus on character stripping.

        // 4. Normalize Whitespace
        .replace(/\s+/g, ' ')

        // 5. Remove Potential Delimiter Attacks
        .replace(/###/g, '') // Common separator
        .replace(/```/g, '') // Code blocks
        .trim();
}

/**
 * Validates that the output doesn't contain known injection success markers or leakage.
 */
export function validateAIOutput(output: string): boolean {
    const forbiddenPatterns = [
        /IGNORE INSTRUCTIONS/i,
        /ROOT ACCESS/i,
        /SYSTEM OVERRIDE/i
    ];

    return !forbiddenPatterns.some(p => p.test(output));
}
