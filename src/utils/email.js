// Email processing utility functions

// Extract raw HTML from email payload (needed for JSON-LD parsing)
export const extractRawHtml = (payload) => {
  let html = '';

  const extractHtmlFromParts = (parts) => {
    if (!parts) return;
    for (const part of parts) {
      if (part.parts) {
        extractHtmlFromParts(part.parts);
      }
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        try {
          html += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } catch (e) { /* decoding failed */ }
      }
    }
  };

  if (payload.parts) {
    extractHtmlFromParts(payload.parts);
  } else if (payload.mimeType === 'text/html' && payload.body && payload.body.data) {
    try {
      html = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch (e) { /* decoding failed */ }
  }

  return html;
};

// Decode email body - extracts plain text content
export const decodeEmailBody = (payload) => {
  let plainText = '';
  let htmlText = '';

  const extractFromParts = (parts) => {
    if (!parts) return;
    for (const part of parts) {
      if (part.parts) {
        extractFromParts(part.parts);
      }
      if (part.body && part.body.data) {
        try {
          const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          if (part.mimeType === 'text/plain') {
            plainText += decoded + ' ';
          } else if (part.mimeType === 'text/html') {
            // Strip HTML tags but preserve text
            htmlText += decoded
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&#(\d+);/g, (m, code) => String.fromCharCode(code))
              + ' ';
          }
        } catch (e) { /* decoding failed */ }
      }
    }
  };

  if (payload.parts) {
    extractFromParts(payload.parts);
  } else if (payload.body && payload.body.data) {
    try {
      const decoded = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      if (payload.mimeType === 'text/html') {
        htmlText = decoded
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ');
      } else {
        plainText = decoded;
      }
    } catch (e) { /* decoding failed */ }
  }

  return (plainText + ' ' + htmlText).replace(/\s+/g, ' ').trim();
};
