import JSZip from 'jszip';

export const downloadAsZip = async (html: string, css: string, javascript: string) => {
  const zip = new JSZip();
  
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Polyglot Studio Export</title>
    <style>
${css}
    </style>
</head>
<body>
${html}
    <script>
${javascript}
    </script>
</body>
</html>`;

  zip.file('index.html', fullHtml);
  zip.file('style.css', css);
  zip.file('script.js', javascript);
  
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'polyglot-studio-export.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadSingleFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};