import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'highlightMention',
    standalone: true
})
export class HighlightMentionPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(value: string | undefined): SafeHtml {
        if (!value) return '';

        // Escape HTML to prevent XSS before adding our markers
        const escaped = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Regex for hashtags: # followed by word characters
        // Regex for mentions: @ followed by word characters
        const hashtagRegex = /(#[a-zA-Z0-9_]+)/g;
        const mentionRegex = /(@[a-zA-Z0-9_]+)/g;

        const highlighted = escaped
            .replace(hashtagRegex, '<span class="hashtag">$1</span>')
            .replace(mentionRegex, '<span class="mention">$1</span>');

        return this.sanitizer.bypassSecurityTrustHtml(highlighted);
    }
}
