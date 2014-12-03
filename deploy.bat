cls
@echo off
echo.
echo 																Adding all to GIT
echo.
echo.
git add .
echo.
echo.
echo 																Commiting all to Git 
echo.
echo.
git commit -m '%1'
echo.
echo.
echo 																Pushing all to Git
echo.
echo.
git push origin 
echo.
echo.
echo 																Pushing all to Heroku
echo.
echo.
git push heroku master
