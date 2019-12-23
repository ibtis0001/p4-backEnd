const mongoose = require('mongoose');




require('dotenv').config({ path: 'variables.env' });


mongoose.connect(process.env.DATABASE, { useUnifiedTopology: true });
mongoose.Promise = global.Promise; 
mongoose.connection.on('error', (err) => {
  console.error(err.message);
});
mongoose.set('useCreateIndex', true)



require('./models/Store');
require('./models/User');




const app = require('./app');
app.set('port', process.env.PORT || 7777);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});


