import './styles/main.scss';

(() => {
  const TOOLTIP_HEIGHT = 252;
  const TOOLTIP_WIDTH = 302;
  const API_BASE_URL = process.env.API_BASE_URL;
  let tooltip;

  function insertTag(parent, element) {
    document.getElementsByTagName(parent)[0].appendChild(element);
  }

  function createTooltip() {
    const div = document.createElement('div');
    div.setAttribute('id', 'rdocs-light-tooltip');
    div.innerHTML = '<h3 id="rdocs-light-tooltip-title"></h3><div id="rdocs-light-tooltip-description"></div>';
    insertTag('body', div);
    tooltip = document.getElementById('rdocs-light-tooltip');
  }

  function getCurrentVisibleHeightAndWidth() {
    const w = window;
    const d = document;
    const e = d.documentElement;
    const g = d.getElementsByTagName('body')[0];
    const x = w.innerWidth || e.clientWidth || g.clientWidth;
    const y = w.innerHeight || e.clientHeight || g.clientHeight;

    return { x, y };
  }

  function hideTooltip() {
    tooltip.style.visibility = 'hidden';
  }

  function showTooltip() {
    tooltip.style.visibility = 'visible';
  }

  function setToolTipPosition(box) {
    const body = document.getElementsByTagName('body')[0];
    const screenSize = getCurrentVisibleHeightAndWidth();

    // Seems necessairy
    screenSize.x -= 25;

    let top = box.top + body.scrollTop - TOOLTIP_HEIGHT;
    let left = box.left - body.scrollLeft;

    if (left + TOOLTIP_WIDTH > screenSize.x) {
      left = screenSize.x - TOOLTIP_WIDTH + body.scrollLeft;
      if (left < 0) {
        hideTooltip();
        return false;
      }
    }

    if (top < body.scrollTop) {
      top = box.bottom + body.scrollTop;
      if (top + TOOLTIP_HEIGHT > screenSize.y + body.scrollTop) {
        hideTooltip();
        return false;
      }
    }

    tooltip.style.top = top;
    tooltip.style.left = left;

    return true;
  }

  function reqLoadListener() {
    const topic = JSON.parse(this.responseText);
    if (topic.title !== undefined) {
      showTooltip();
      document.getElementById('rdocs-light-tooltip-title').innerHTML = topic.title;
      document.getElementById('rdocs-light-tooltip-description').innerHTML = topic.description || '';
    } else {
      const urlRegexString = `${API_BASE_URL}/api/light/packages/(.*)/topics/(.*)`;
      const urlRegex = new RegExp(urlRegexString, 'g');
      const match = urlRegex.exec(this.responseURL);
      console.log(`No documentation found for ${match[1]}::${match[2]}`);
    }
  }

  function reqErrorListener() {
    console.error('Something went wrong when retrieving the data, hiding rdocs light widget.');
  }

  function parseAttribute(attribute) {
    const splitted = attribute.split('::');
    if (splitted.length === 2) {
      return {
        package: splitted[0],
        topic: splitted[1],
      };
    }
    return undefined;
  }

  function sendRequest(attribute) {
    const data = parseAttribute(attribute);
    if (data !== undefined) {
      const oReq = new XMLHttpRequest();
      oReq.addEventListener('load', reqLoadListener);
      oReq.addEventListener('error', reqErrorListener, false);
      oReq.open('get', `${API_BASE_URL}/api/light/packages/${data.package}/topics/${data.topic}`, true);
      oReq.send();
    } else {
      // TODO
    }
  }

  function mouseOverListener(DOMElement) {
    const element = DOMElement;
    element.classList.add('rdocs-light-hovered');
    const visible = setToolTipPosition(element.getBoundingClientRect());
    if (visible) {
      sendRequest(element.getAttribute('data-mini-rdoc'));
    } else {
      console.info('Not enough space, rdocs light widget not shown.');
    }
  }

  function mouseOutListener(DOMElement) {
    const element = DOMElement;
    element.classList.remove('rdocs-light-hovered');
    hideTooltip();
  }

  function findAllRDocLightDataAttributes() {
    const links = document.querySelectorAll('[data-mini-rdoc]');

    if (links.length === 0) {
      console.log('No RDocumentation links found.');
    }

    links.forEach(linkElement => linkElement.addEventListener('mouseover', () => mouseOverListener(linkElement)));
    links.forEach(linkElement => linkElement.addEventListener('mouseout', () => mouseOutListener(linkElement)));
  }

  function initRDocsLight() {
    createTooltip();
    findAllRDocLightDataAttributes();
  }

  function isAlreadyExecuted() {
    return (tooltip !== undefined);
  }

  if (!isAlreadyExecuted()) {
    if (document.readyState === 'complete' || document.readyState === 'loaded') {
      initRDocsLight();
    } else {
      document.addEventListener('DOMContentLoaded', initRDocsLight);
    }
  } else {
    console.info('Warning: tried to load RDocs Light multiple times.');
  }
})();
