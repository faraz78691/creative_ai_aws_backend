import Busboy from 'busboy';

function uploadFiles(req, res, next) {
  if (req.headers['content-type']?.startsWith('multipart/form-data')) {
    const bb = Busboy({ headers: req.headers });
    req.files = [];
    req.body = {};

    bb.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];

      file.on('data', chunk => chunks.push(chunk));
      file.on('end', () => {
        req.files.push({
          fieldname,
          filename: filename || 'file.jpg',
          mimetype: mimeType || 'application/octet-stream',
          buffer: Buffer.concat(chunks),
        });
      });
    });

    bb.on('field', (name, val) => {
      req.body[name] = val;
    });

    bb.on('finish', () => next());
    req.pipe(bb);
  } else {
    next();
  }
}

export default uploadFiles;
