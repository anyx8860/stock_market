# Heroku Installation Instructions.

1. Login to Heroku.
2. Follow the instructions [here](https://devcenter.heroku.com/articles/heroku-cli) to install the Heroku CLI.
3. Install flask-heroku and gunicorn Python modules (`pip3 install flask-heroku gunicorn`)
4. Login in heroku by typing `heroku login` and follow the instructions.
5. Add `requirements.txt`, `Procfile` and modify your flask App as done in [this]() commit.
6. Go to the folder that contains the project and run `heroku create` to create the app. This will also add a remote called `heroku` to which you need to push your changes.
7. Then push the change to the `heroku` remote: `git push heroku master`.
