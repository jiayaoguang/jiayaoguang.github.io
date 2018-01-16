//画圆水平线文字
function drawCircularText(string, startAngle, endAngle) {
    var radius = circle.radius,
        angleDecrement = (startAngle - endAngle)/(string.length-1),
        angle = parseFloat(startAngle),
        index = 0,
        character;

    context.save();
    context.fillStyle = TEXT_FILL_STYLE;
    context.strokeStyle = TEXT_STROKE_STYLE;
    context.font = TEXT_SIZE + 'px Lucida Sans';

    while (index < string.length) {
        character = string.charAt(index);

        context.save();
        context.beginPath();

        context.translate(
            circle.x + Math.cos(angle) * radius,
            circle.y - Math.sin(angle) * radius);

        context.rotate(Math.PI/2 - angle);

        context.fillText(character, 0, 0);
        context.strokeText(character, 0, 0);

        angle -= angleDecrement;
        index++;

        context.restore();
    }
    context.restore();
}

//==================\
var image = new Image(),
    canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    sunglassButton = document.getElementById('sunglassButton'),
    sunglassesOn = false,
    sunglassFilter = new Worker('sunglassFilter.js');

function putSunglassesOn() {
    sunglassFilter.postMessage(
        context.getImageData(0, 0, canvas.width, canvas.height));

    sunglassFilter.onmessage = function (event) {
        context.putImageData(event.data, 0, 0);
    };
}

function drawOriginalImage() {
    context.drawImage(image, 0, 0,
        image.width, image.height, 0, 0,
        canvas.width, canvas.height);
}

sunglassButton.onclick = function() {
    if (sunglassesOn) {
        sunglassButton.value = 'Sunglasses';
        drawOriginalImage();
        sunglassesOn = false;
    }
    else {
        sunglassButton.value = 'Original picture';
        putSunglassesOn();
        sunglassesOn = true;
    }
};

image.src = '../../shared/images/curved-road.png';
image.onload = function() {
    drawOriginalImage();
};