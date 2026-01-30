
const { registerUsers} = require ("../controller/auth.controller.js");
const { loginUsers} = require ("../controller/auth.controller.js");
const { authToken } = require("../middleware/authToken.middleware.js");
const {validateRegister} = require ("../middleware/validateRegister.middleware.js");
const { getMe} = require ("../controller/auth.controller.js");
const { logoutUsers} = require ("../controller/auth.controller.js");

const authRouter = (router) => {
    router.post('/register', validateRegister, registerUsers);
    router.post('/login', loginUsers);
    router.get('/me',authToken,getMe);
    router.post('/logout', logoutUsers);
}


module.exports = {authRouter};