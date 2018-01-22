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
        //使角色移动

        //利用视差滚动绘制背景
        game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
        game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft/8,0,640,480,0,0,640,480);

        //绘制弹弓
        game.context.drawImage(game.slingshoutImage,game.slingshoutX - game.offsetLeft,game.slingshoutY);
        game.context.drawImage(game.slingshoutFrontImage,game.slingshoutX - game.offsetLeft,game.slingshoutY);
        if(!game.ended){
            game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        }
    }
};

var levels = {

    //关卡数据
    data: [
        {//第一关
            foreground: 'front-01',
            background:'bg-01',
            entities:[]
        },
        {//第二关
            foreground: 'front-01',
            background:'bg-01',
            entities:[]
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
        game.currentLevel = {number:number,hero:[]};
        game.score = 0;
        $('#score').html('Score: ' + game.score);
        var level = levels.data[number];
        game.currentLevel.backgroundImage = loader.loadImage("images/"+level.background+".png");
        game.currentLevel.foregroundImage = loader.loadImage("images/"+level.foreground+".png");
        game.slingshoutImage = loader.loadImage("images/slingshout.png");
        game.slingshoutFrontImage = loader.loadImage("images/slingshout-front.png");
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
        var offset = $('gamecanvas').offset();
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