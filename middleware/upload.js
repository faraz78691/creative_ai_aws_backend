import multer from 'multer';
import path from 'path';
const storageProduct = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/profile/');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}${Date.now()}.jpg`);
  }
});

const uploadProfile = multer({ storage: storageProduct });



const contactStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/contact_us_files/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // e.g., '.png'
    const originalName = path.basename(file.originalname, ext); // remove extension
    cb(null, `${originalName}-${Date.now()}${ext}`);
  }
});

const uploadContactStorage = multer({ storage: contactStorage });

export { uploadContactStorage ,uploadProfile};
