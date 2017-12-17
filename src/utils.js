const storage = {
    destination: function (req, file, cb) {
        cb(null, './public/avatars')
    },
    filename: function (req, file, cb) {
        let randomStr = Math.random().toString(36).substr(2, 8)
        let extension = file.originalname.split('.').pop()
        cb(null, `${randomStr}.${extension}`)
    }
};

module.exports = {
    fileStorage: storage
}