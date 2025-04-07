const path = require('path');
const LoadDataSerice = require("./sevice.js")
const routes = (app) => {
    app.get("/", (req,res)=>{
        res.sendFile(path.join(__dirname, 'index.html'));
    })

    app.get("/loading-data", LoadDataSerice.loadData);
}
module.exports = routes;