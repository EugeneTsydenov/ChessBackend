import {Router} from "express";
import {body} from "express-validator";
import userController from "../controllers/user-controller";
import {authMiddleware} from "../middlewares/auth-middleware";
const router:Router = Router();

router.post('/login',
  body('email').isEmail(),
  body('password').isLength({min: 3, max: 8}),
  userController.login);
router.post('/registration',
  body('email').isEmail(),
  body('password').isLength({min: 3, max: 8}),
  userController.registration);
router.post('/logout', userController.logout);
router.get('/refresh', userController.refresh);
router.get('/user', authMiddleware, userController.getUser);
export default router