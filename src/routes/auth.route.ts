import express from 'express';
import { setDataToRequestObject } from '../middlewares/setDataToReqObj';
import login from '../controllers/auth/login/login';
import { learnerAuth } from '../middlewares/learnerAuth';
import logout from '../controllers/auth/logout/logout';

export const authRouter = express.Router();

// authRouter.post('/encrypt', setDataToRequestObject('api.auth.encrypt'), learnerAuth, async (req, res) => {
//   const { text } = req.body;
//
//   const encryptedText = await bcrypt.hash(text, 10);
//   res.json({
//     originalText: text,
//     encryptedText: encryptedText,
//   });
// });

authRouter.get('/csrf-token', setDataToRequestObject('api.auth.csrf'), (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

authRouter.post('/login', setDataToRequestObject('api.auth.login'), login);

authRouter.post('/logout', setDataToRequestObject('api.auth.logout'), learnerAuth, logout);
