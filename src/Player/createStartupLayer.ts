
export type StartupLayer = {
    rootElement: HTMLDivElement;
    menuContentElement: HTMLDivElement;
    loadingContentElement: HTMLDivElement;
    loadingGageElement: HTMLDivElement;
}

export function createStartupLayer(onClickPlayButton: () => void): StartupLayer {
    const stylesText = `
body {
  overflow: hidden;
}

* {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
} 

#wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  background-color: black;
}

#w {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: black;
  z-index: 9999;
}
#o {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  width: 200px;
  height: 20px;
  box-sizing: border-box;
  border: 5px solid white;
}
#i {
  width: 0;
  height: 100%;
  box-sizing: border-box;
  background-color: white;
  position: absolute;
  border: 1px solid black;
  transition: width 1s ease-out;
}
#c {
  display: none;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  flex-direction: column;
}
#c button {
  display: block;
}
#p {
  margin-top: 1em;
}

`;
    const styleElement = document.createElement('style');
    styleElement.innerText = stylesText;
    document.head.appendChild(styleElement);

    const startupWrapperElement = document.createElement('div');
    startupWrapperElement.id = 'w';

    const loadingContentElement = document.createElement('div');
    loadingContentElement.id = 'o';
    startupWrapperElement.appendChild(loadingContentElement);

    const loadingGageElement = document.createElement('div');
    loadingGageElement.id = 'i';
    loadingContentElement.appendChild(loadingGageElement);

    const menuContentElement = document.createElement('div');
    menuContentElement.id = 'c';
    startupWrapperElement.appendChild(menuContentElement);

    const fullscreenButtonElement = document.createElement('button');
    fullscreenButtonElement.id = 'f';
    fullscreenButtonElement.textContent = 'FULL SCREEN';
    menuContentElement.appendChild(fullscreenButtonElement);

    const playButtonElement = document.createElement('button');
    playButtonElement.id = 'p';
    playButtonElement.textContent = 'PLAY';
    menuContentElement.appendChild(playButtonElement);

    document.body.appendChild(startupWrapperElement);

    // const hideLoading = () => {
    //     loadingContentElement.style.display = 'none';
    // };
    // const setLoadingPercentile = (percent: number) => {
    //     loadingGageElement.style.width = `${percent}%`;
    // };
    // const showMenu = () => {
    //     menuContentElement.style.display = 'flex';
    // };

    // const hideStartupWrapper = () => {
    //     startupWrapperElement.style.display = 'none';
    // };

    fullscreenButtonElement.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            // eslint-disable-next-line
            document.documentElement.requestFullscreen().then(() => {
                console.log('fullscreen');
            });
        }
    });
    
    const startupLayer = {
        rootElement: startupWrapperElement,
        menuContentElement,
        loadingContentElement,
        loadingGageElement,
    };

    playButtonElement.addEventListener('click', () => {
        hideStartupLayerWrapper(startupLayer);
        onClickPlayButton();
    });

    // return {
    //     rootElement: startupWrapperElement,
    //     hideLoading,
    //     setLoadingPercentile,
    //     showMenu,
    //     hideStartupWrapper,
    // };
    
    return startupLayer;
}

export function hideStartupLayerLoading(startupLayer: StartupLayer) {
    startupLayer.loadingContentElement.style.display = 'none';
}

export function setStartupLayerLoadingPercentile(startupLayer: StartupLayer, percent: number) {
    startupLayer.loadingGageElement.style.width = `${percent}%`;
}

export function showStartupLayerMenu(startupLayer: StartupLayer) {
    startupLayer.menuContentElement.style.display = 'flex';
}

export function hideStartupLayerWrapper(startupLayer: StartupLayer) {
    startupLayer.rootElement.style.display = 'none';
}
