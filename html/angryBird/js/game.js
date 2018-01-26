var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;


(function () {
    var lastTime = 0;
    var vendors = ['ms','moz','webkit','o'];
    for(var x = 0;x<vendors.length && !window.requestAnimationFrame; ++x){
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'];
    }
    if(!window.requestAnimationFrame){
        window.requestAnimationFrame = function (callback,element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0,16-(currTime - lastTime));
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            } , timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
        if(!window.cancelAnimationFrame){
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }
    }
})();

$(window).load(function () {
    game.init();
});

var game = {

    //初始化所有对象，预加载资源，并显示开始画面
    init:function () {

        levels.init();
        loader.init();
        mouse.init();

        //隐藏所有图层，显示开始画面
        $('.gamelayer').hide();
        $('#gamestartscreen').show();

        //获取游戏画布
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');
    },

    showLevelScreen:function () {
        $('.gamelayer').hide();
        $('#levelselectscreen').show('slow');
    },

    //游戏阶段
    mode:"intro",
    //弹弓的x和y坐标
    slingshoutX:140,
    slingshoutY:280,

    start:function () {
        $('.gamelayer').hide();
        //显示游戏画布和得分
        $('#gamecanvas').show();
        $('.scorescreen').show();
        game.mode = "intro";
        game.offsetLeft = 0;
        game.ended = false;
        game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
    },
    //画面最大平移速度
    maxSpeed:3,
    //画面最大和最小平移位置
    minOffset:0,
    maxOffset:300,
    //画面当前平移位置
    offsetLeft:0,

    score:0,
    //画面中心平移到newCenter
    panTo:function (newCenter) {
        if(Math.abs(newCenter - game.maxOffset - game.canvas.width/4) > 0
            && game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset){
            var deltaX = Math.round( (newCenter - game.offsetLeft - game.canvas.width/4)/2 );
            if(deltaX && Math.abs(deltaX) > game.maxSpeed){
                deltaX = game.maxSpeed*Math.abs(deltaX)/(deltaX);
            }
            game.offsetLeft += deltaX;
        }else{
            return true;
        }
        if(game.offsetLeft <= game.minOffset){
            game.offsetLeft = game.minOffset;
            return true;
        }else if(game.offsetLeft > game.maxOffset){
            game.offsetLeft = game.maxOffset;
            return true;
        }
        return false;
    },

    handlePanning:function () {
        if(game.mode === "intro"){
            if(game.panTo(700)){
                game.mode = "load-next-hero";
            }
        }
        if(game.mode === "wait-for-firing"){
            if(mouse.dargging){
                game.panTo(mouse.x + game.offsetLeft);
            }else{
                game.panTo(game.slingshoutX);
            }
        }
        if(game.mode === "load-next-hero"){
            //检查是否有坏蛋活着
            //检查是否有可装填英雄
            //装填英雄，状态切换至wait-for-firing
            game.mode = "wait-for-firing";
        }
        if(game.mode === "firing"){
            game.panTo(game.slingshoutX);
        }
        if(game.mode === "fired"){
            //TODO
        }
    },


    animate : function () {
        //移动背景
        game.handlePanning();
        //TODO使角色移动

        //利用视差滚动绘制背景
        game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
        game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft/8,0,640,480,0,0,640,480);

        //绘制弹弓
        game.context.drawImage(game.slingshoutImage,game.slingshoutX - game.offsetLeft,game.slingshoutY);

        //绘制所有物体
        game.drawAllBodies();

        //绘制弹弓支架
        game.context.drawImage(game.slingshoutFrontImage,game.slingshoutX - game.offsetLeft,game.slingshoutY);

        if(!game.ended){
            game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        }
    },

    drawAllBodies:function () {
        box2d.world.DrawDebugData();
        //TODO,遍历所有物品，并在canvas上绘制出来
        for(var body = box2d.world.GetBodyList(); body ; body = body.GetNext()){
            var entity = body.GetUserData();
            if(entity){
                entities.draw(entity,body.GetPosition(),body.GetAngle());
            }
        }
    }
};

var levels = {

    //关卡数据
    data: [
        {//第一关
            foreground: 'front-01',
            background:'bg-01',
            entities:[
                {type:"ground",name:"dirt",x:500,y:440,width:1000,height:20,isStatic:true},
                {type:"ground",name:"wood",x:180,y:390,width:40,height:80,isStatic:true},

                {type:"block",name:"wood",x:520,y:375,angle:90,width:100,height:25},
                {type:"block",name:"glass",x:520,y:275,angle:90,width:100,height:25},
                {type:"villain",name:"burger",x:520,y:200,calories:590},

                {type:"block",name:"wood",x:620,y:375,angle:90,width:100,height:25},
                {type:"block",name:"glass",x:620,y:275,angle:90,width:100,height:25},
                {type:"villain",name:"burger",x:620,y:200,calories:420},

                {type:"hero",name:"orange",x:90,y:410},
                {type:"hero",name:"orange",x:150,y:410},
            ]
        },
        {//第二关
            foreground: 'front-01',
            background: 'bg-01',
            entities:[
                {type:"ground",name:"dirt",x:500,y:440,width:1000,height:20,isStatic:true},
                {type:"ground",name:"wood",x:180,y:390,width:40,height:80,isStatic:true},
                {type:"block",name:"wood",x:820,y:375,angle:90,width:100,height:25},
                {type:"block",name:"wood",x:720,y:375,angle:90,width:100,height:25},
                {type:"block",name:"wood",x:620,y:375,angle:90,width:100,height:25},
                {type:"block",name:"wood",x:670,y:375,angle:90,width:100,height:25},
                {type:"block",name:"glass",x:670,y:310,width:100,height:25},
                {type:"block",name:"glass",x:770,y:310,width:100,height:25},

                {type:"block",name:"wood",x:670,y:248,angle:90,width:100,height:25},
                {type:"block",name:"glass",x:770,y:248,angle:90,width:100,height:25},
                {type:"block",name:"wood",x:720,y:180,width:100,height:25},

                {type:"villain",name:"burger",x:715,y:160,calories:590},
                {type:"villain",name:"fries",x:620,y:400,calories:420},
                {type:"villain",name:"sodacan",x:620,y:395,calories:150},

                {type:"hero",name:"strawberry",x:40,y:420},
                {type:"hero",name:"orange",x:90,y:410},
                {type:"hero",name:"apple",x:150,y:410},
            ]
        }
    ],
    //初始化关卡选择画面
    init:function () {
        var html = "";
        for(var i = 0;i <levels.data.length;i++){
            var level = levels.data[i];
            html += ('<input class="levelbt" type="button" value="' + (i+1)+'">');
        }
        $('#levelselectscreen').html(html);

        //单击按钮时加载关卡
        $('.levelbt').click(function () {
                levels.load(this.value-1);
                $('#levelselectscreen').hide();
        });

    },
    //为第一关加载所有的数据
    load:function (number) {
        //关卡加载时，初始化Box2D世界
        box2d.init();
        //声明新的当前关卡对象
        game.currentLevel = {number:number,hero:[]};
        game.score = 0;
        game.currentHero = undefined;
        $('#score').html('Score: ' + game.score);
        var level = levels.data[number];
        //加载背景图前景图，弹弓图像
        game.currentLevel.backgroundImage = loader.loadImage("images/"+level.background+".png");
        game.currentLevel.foregroundImage = loader.loadImage("images/"+level.foreground+".png");
        game.slingshoutImage = loader.loadImage("images/slingshout.png");
        game.slingshoutFrontImage = loader.loadImage("images/slingshout-front.png");

        //加载所有物体
        for(var i = level.entities.length-1;i >= 0; i--){
            var entity = level.entities[i];
            entities.create(entity);
        }

        if(loader.loaded){
            game.start();
        }else{
            loader.onload = game.start;
        }
    }
};

var loader = {
    loaded:true,
    loadedCount:0,//已加载的资源数
    totalCount:0,//需要被加载的资源数

    init:function () {
        //检查浏览器支持的声音格式
        var mp3Support,oggSupport;
        var audio = document.createElement('audio');
        if(audio.canPlayType){
            mp3Support = ""!==audio.canPlayType('audio/mpeg');
            oggSupport = ""!==audio.canPlayType('audio/ogg');
        }else{
            mp3Support = false;
            oggSupport = false;
        }
        loader.soundFileExtn = ( oggSupport?".ogg":(mp3Support?".mp3":undefined ));
    },
    loadImage:function (url) {
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var image = new Image();
        image.src = url;
        image.onload = loader.itemLoaded;
        return image;
    },
    soundFileExtn:".ogg",
    loadSound:function (url) {
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var audio = new Audio();
        audio.src = url +loader.soundFileExtn;
        audio.addEventListener("canplaythrough",loader.itemLoaded,false);
        return audio;
    },

    itemLoaded:function () {
        loader.loadedCount++;
        $('#loadingmessage').html('loaded ' + loader.loadedCount+' of '+loader.totalCount);
        if(loader.loadedCount === loader.totalCount){
            //完成了加载
            loader.loaded = true;
            //hide the loading screen
            $('#loadingscreen').hide();
            if(loader.onload){
                loader.onload();
                loader.onload = undefined;
            }
        }
    }
};

var mouse = {
    x:0,
    y:0,
    down:false,
    init:function () {
        var canvas = $('#gamecanvas');
        canvas.mousemove(mouse.mousemovehandler);
        canvas.mousedown(mouse.mousedownhandler);
        canvas.mouseup(mouse.mouseuphandler);
        canvas.mouseout(mouse.mouseouthandler);
    },

    mousemovehandler:function (event) {
        var offset = $('#gamecanvas').offset();
        mouse.x = event.pageX - offset.left;
        mouse.y = event.pageY - offset.top;
        if(mouse.down){
            mouse.dargging = true;
        }
    },
    mousedownhandler:function (event) {
        mouse.down = true;
        mouse.downX = mouse.x;
        mouse.downY = mouse.y;
        event.originalEvent.preventDefault();
    },
    mouseuphandler:function (event) {
        mouse.down = false;
        mouse.dargging = false;
    },
    mouseouthandler:function (event) {

    }
};

var entities = {
  definitions:{
      "glass":{
        fullHealth:100,
        density:2.4,
        friction:0.4,
        restitution:0.15,
      },
      "wood":{
          fullHealth:500,
          density:0.7,
          friction:0.4,
          restitution:0.4,
      },
      "dirt":{
          density:3.0,
          friction:1.5,
          restitution:0.2,
      },
      "burger":{
          shape:"circle",
          fullHealth:40,
          redius:25,
          density:1,
          friction:0.5,
          restitution:0.4,
      },
      "sodacan":{
          shape:"rectangle",
          fullHealth:80,
          width:40,
          height:60,
          density:1,
          friction:0.5,
          restitution:0.7,
      },
      "fries":{
          shape:"rectangle",
          fullHealth:50,
          width:40,
          height:50,
          density:1,
          friction:0.5,
          restitution:0.6,
      },
      "strawberry":{
          shape:"circle",
          redius:25,
          density:1.5,
          friction:0.5,
          restitution:0.4,
      },
      "orange":{
          shape:"circle",
          redius:25,
          density:1.5,
          friction:0.5,
          restitution:0.4,
      },
      "apple":{
          shape:"circle",
          redius:15,
          density:2.0,
          friction:0.5,
          restitution:0.4,
      },
  },

  //以物体作为参数，创建一个Box2D物体，并加入世界
  create:function (entity) {
      var definition = entities.definitions[entity.name];
      if(!definition){
          console.log("undefined entity name",entity.name);
          return;
      }
      switch(entity.type){
          case "block": //简单的矩形 障碍物
                entity.health = definition.fullHealth;
                entity.fullHealth = definition.fullHealth;
                entity.shape = "rectangle";
                entity.sprite = loader.loadImage("images/role/"+entity.name+".png");
                box2d.createRectangle(entity,definition);
                break;
          case "ground": //简单的矩形 地面
              //不可摧毁物体,没有生命值
              entity.shape = "rectangle";
              //不会被画出，所以不必具有图像
              box2d.createRectangle(entity,definition);
              break;
          case "hero":
          case "villain":
              entity.health = definition.fullHealth;
              entity.fullHealth = definition.fullHealth;
              entity.sprite = loader.loadImage("images/role/"+entity.name+".png");
              if(definition.shape === "circle"){
                  entity.radius = definition.radius;
                  box2d.createCircle(entity,definition);
              }else if(definition.shape === "rectangle"){
                  entity.width = definition.width;
                  entity.height = definition.height;
                  box2d.createRectangle(entity,definition);
              }
              break;
          default:
              console.log("undefined entity type ," , entity.type);
              break;
        }
      },

      //以物体,物体的位置和角度作为参数，绘制物体
      draw:function (entity,position,angle) {

            game.context.translate(position.x*box2d.scale-game.offsetLeft , position.y*box2d.scale);
            game.context.rotate(angle);

            switch (entity.type){
                case "block":
                    game.context.drawImage(entity.sprite , 0 , 0 , entity.sprite.width , entity.sprite.height,
                        -entity.radius-1,-entity.radius-1 , entity.radius*2+ 2 , entity.radius*2+2 );
                    break;
                case "villain":
                case "hero":
                    if(entity.shape === "circle"){
                        game.context.drawImage(entity.sprite , 0 , 0 , entity.sprite.width , entity.sprite.height,
                            -entity.width/2-1,-entity.height/2-1 , entity.width+ 2 , entity.height+2 );
                    }else if(entity.shape === "rectangle"){
                        game.context.drawImage(entity.sprite , 0 , 0 , entity.sprite.width , entity.sprite.height,
                            -entity.width/2-1,-entity.height/2-1 , entity.width+ 2 , entity.height+2 );
                    }
                    break;
                case "ground":
                    break;

            }
            game.context.rotate(-angle);
            game.context.translate(-position.x*box2d.scale+game.offsetLeft , -position.y*box2d.scale);
      },

};

var box2d = {
    scale:30,
    init:function () {
      var gravity = new b2Vec2(0, 2.8);//物理加速度为9.8m/s²,方向朝下
      var allowSleep = true;//允许静止的物体处于休眠状态，精致的物体不参与物理仿真计算
      box2d.world  = new b2World(gravity,allowSleep);

      var debugContext = document.getElementById("debugcanvas").getContext("2d");
      var debugDraw = new b2DebugDraw();
        debugDraw.SetSprite(debugContext);
        debugDraw.SetFillAlpha(0.3);
        debugDraw.SetLineThickness(1.0);
        debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
        box2d.world.SetDebugDraw(debugDraw);

    },
    createRectangle:function (entity,definition) {
        var bodyDef = new b2BodyDef;
        if(entity.isStatic){
            bodyDef.type = b2Body.b2_staticBody;
        } else{
            bodyDef.type = b2Body.b2_dynamicBody;
        }
        bodyDef.position.x = entity.x/box2d.scale;
        bodyDef.position.y = entity.y/box2d.scale;
        if(entity.angle){
            bodyDef.angle = Math.PI*entity.angle/180;
        }
        var fixtureDef = new b2FixtureDef;
        fixtureDef.density = definition.density;
        fixtureDef.friction = definition.friction;
        fixtureDef.restitution = definition.restitution;

        fixtureDef.shape = new b2PolygonShape;
        fixtureDef.shape.SetAsBox(entity.width/2/box2d.scale , entity.height/2/box2d.scale);

        var body = box2d.world.CreateBody(bodyDef);
        body.SetUserData(entity);

        var fixture = body.CreateFixture(fixtureDef);
        return body;
    },

    createCircle : function(entity,definition) {
        var bodyDef = new b2BodyDef;
        if(entity.isStatic){
            bodyDef.type = b2Body.b2_staticBody;
        } else{
            bodyDef.type = b2Body.b2_dynamicBody;
        }
        bodyDef.position.x = entity.x/box2d.scale;
        bodyDef.position.y = entity.y/box2d.scale;
        if(entity.angle){
            bodyDef.angle = Math.PI*entity.angle/180;
        }
        var fixtureDef = new b2FixtureDef;
        fixtureDef.density = definition.density;
        fixtureDef.friction = definition.friction;
        fixtureDef.restitution = definition.restitution;

        fixtureDef.shape = new b2CircleShape(entity.radius/box2d.scale);

        var body = box2d.world.CreateBody(bodyDef);
        body.SetUserData(entity);

        var fixture = body.CreateFixture(fixtureDef);
        return body;
    }

};