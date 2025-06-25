const express = require("express");
const UserController = require('../controllers/userController');

const router = express.Router();

router.post('/register',UserController.create);
router.post('/login',UserController.login);
router.get('/getall',UserController.getAll);
router.get('/:id',UserController.getOne);
router.put('/:id',UserController.update);
router.delete('/:id',UserController.delete);



module.exports = router;