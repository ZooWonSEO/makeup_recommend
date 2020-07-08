const [
    splashContainer,
    webcamContainer,
    webcamVideo,
    webcamCaptureButton,
    captureContainer,
    captureCanvas,
    captureAgainButton,
    captureRecommendButton,
    recommendContainer,
    recommendClass,
    recommendList,
    recommendAgainButton
] = [
    'splash-container',
    'webcam-container',
    'webcam-video',
    'webcam-capture-button',
    'capture-container',
    'capture-canvas',
    'capture-again-button',
    'capture-recommend-button',
    'recommend-container',
    'recommend-class',
    'recommend-list',
    'recommend-again-button',
].map(id => document.getElementById(id));

let model;
let videoTracks;

async function init() {
    const modelURL = "/model/model.json";
    const metadataURL = "/model/metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
    } catch (e) {
        alert('Failed to load model.');
        throw e;
    }

    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoTracks = stream.getVideoTracks();

        if (videoTracks.length <= 0) {
            throw new Error('no video tracks');
        }
    } catch (e) {
        alert('Camera permission denied. Please allow camera permission.');
        throw e;
    }

    // First prediction takes about 3 seconds.
    await model.predict(captureCanvas);

    webcamVideo.srcObject = stream;

    const { width, height, aspectRatio } = videoTracks[0].getSettings();

    captureCanvas.width = width;
    captureCanvas.height = height;
    captureCanvas.setAttribute('data-aspect-ratio', aspectRatio);

    splashContainer.style.display = 'none';
    webcamContainer.style.display = '';
}

webcamCaptureButton.addEventListener('click', () => {
    const context = captureCanvas.getContext('2d');
    context.save();
    context.translate(captureCanvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(webcamVideo, 0, 0, captureCanvas.width, captureCanvas.height);
    context.restore();

    webcamContainer.style.display = 'none';
    captureContainer.style.display = '';
});

captureAgainButton.addEventListener('click', () => {
    captureContainer.style.display = 'none';
    webcamContainer.style.display = '';
});

const classNameMap = {
    'dog': '강아지상',
    'cat': '고양이상',
    'deer': '사슴상',
    'rabbit': '토끼상',
};

captureRecommendButton.addEventListener('click', async () => {
    const prediction = await model.predict(captureCanvas);
    const maxPrediction = prediction.reduce((a, b) => a.probability > b.probability ? a: b);

    const className = maxPrediction.className;
    const recommends = await getRecommendList(className);

    recommendClass.innerText = classNameMap[className];

    recommendList.innerHTML = '';
    recommends.map(createRecommendItem).forEach(item => {
        recommendList.appendChild(item);
    });

    captureContainer.style.display = 'none';
    recommendContainer.style.display = '';

    recommendContainer.classList.add(`recommend-${className}`);
});

recommendAgainButton.addEventListener('click', async () => {
    location.reload();
});

function createRecommendItem(recommend) {
    const item = document.createElement('a');
    item.className = 'recommend-item';
    item.setAttribute('href', recommend.url);

    if (!recommend.url.startsWith('#')) {
        item.setAttribute('target', '_blank');
    }

    const title = document.createElement('div');
    title.className = 'recommend-item-title';
    title.innerText = recommend.title;
    item.appendChild(title);

    return item;
}

function getRecommendList(faceType) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.onload = function () {
            if (xhr.status !== 200) {
                return reject(xhr);
            }

            try {
                const json = JSON.parse(xhr.responseText);

                if (!Array.isArray(json.recommends)) {
                    throw new Error('recommends should be array');
                }

                resolve(json.recommends);
            }
            catch (e) {
                reject(xhr);
            }
        };

        xhr.open('GET', `/recommends/${faceType}`);

        xhr.send();
    });
}

init();