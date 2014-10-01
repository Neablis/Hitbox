Hitbox
======

Hitbox javascript api implementation

#Resources

http://help.hitbox.tv/customer/portal/articles/1470464-changes-to-websocket---3-6-2014

http://hitakashi.github.io/Hitbox-Chat-Methods/

http://developers.hitbox.tv/

#Currently implemented 

* Media(t)
* User(u)
* Followers(u)
* Games(u)
* Teams(u)
* Token(u-broken)
* Ingesting(u-broken)
* Websocket
   ⋅⋅* Connecting(u)
   ⋅⋅* Messages(u-broken)

u = untested

t = tested

#Gulp tasks
* gulp docs - Auto generate documentation
* gulp lint - Runs linter on code
* gulp scripts - Builds code into min versin
* gulp test - Runs tests
* gulp watch - Watches code for changes and runs gulp scripts and gulp link
