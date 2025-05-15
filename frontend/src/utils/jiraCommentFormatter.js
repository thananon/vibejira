/**
 * Utility to format Jira comment text for better readability
 */

/**
 * Formats Jira comment text to properly render colors and other formatting
 * @param {string} text - The Jira comment text
 * @returns {string} - HTML formatted text
 */
export const formatJiraComment = (text) => {
  if (!text) return '';

  // Handle color formatting {color:#hex}text{color}
  let formattedText = text.replace(
    /{color:#([0-9a-fA-F]{6})}(.*?){color}/g, 
    '<span style="color: #$1">$2</span>'
  );

  // Handle bold text *text*
  formattedText = formattedText.replace(
    /\*([\w\W]+?)\*/g,
    '<strong>$1</strong>'
  );

  // Handle links [text|url] or [url|text]
  formattedText = formattedText.replace(
    /\[(.+?)\|(.+?)\]/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Handle newlines
  formattedText = formattedText.replace(/\n/g, '<br />');
  
  // Handle bullet lists
  formattedText = formattedText.replace(/^\s*\*\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive list items in ul tags
  formattedText = formattedText.replace(
    /(<li>.+?<\/li>)+/g,
    '<ul>$&</ul>'
  );

  return formattedText;
};

export default formatJiraComment;