(function () {

    const Game = (function () {
        const menuManager = (function () {

            const menuContainer = document.getElementById('menu-screen');
            const messageContainer = document.getElementById('menu-message');
            const pauseScreen = document.getElementById('pause-screen');
            const pauseImage = document.getElementById('pause-image');

            const options = [];
            options['reset'] = document.getElementById('reset-options');
            options['type'] = document.getElementById('type-options');
            options['custom'] = document.getElementById('custom-options');

            const translucentCanvas = function () {
                canvasElement.className = 'translucent';
            };

            const hideMenus = function () {
                let option;
                menuContainer.style.display = 'none';

                for (option in options) {
                    if (options.hasOwnProperty(option)) {
                        options[option].style.display = 'none';
                    }
                }
            };

            const displayMenu = function (message, menu) {
                hideMenus();
                messageContainer.innerHTML = message;
                options[menu].style.display = 'block';
                menuContainer.style.display = 'block';
                pauseScreen.style.display = 'none';

                translucentCanvas();
            };

            return {
                hide: function () {
                    hideMenus();
                },
                displayMenu: function (message, menu) {
                    displayMenu(message, menu);
                },
                pauseOn: function () {
                    pauseScreen.style.display = 'block';
                    pauseImage.className = 'play';
                },
                pauseOff: function () {
                    pauseScreen.style.display = 'none';
                    pauseImage.className = 'pause';
                }
            };
        }());
        const elementsManager = (function () {

            let elements;
            const clearEmptyElement = function (key) {

                const element = elements[key];

                if (element === undefined || element.isBomb === true || element.getStatus() === 'marked') {
                    return;
                }

                element.setStatus('empty');

                if (element.neighbours === 0) {
                    clearEmptyNeighbourElements(key);
                }
            };
            // for use in clearEmptyNeighbourElements
            let empty;
            const clearEmptyNeighbourElements = function (key) {

                if (empty.indexOf(key) !== -1) {
                    return;
                }

                empty.push(key);

                getNeighborKeys(key).forEach(function (neighbor) {
                    clearEmptyElement(neighbor);
                });

                return true;
            };

            let marked = [];

            const isElementBomb = function (key) {
                return elements[key] !== undefined && elements[key].isBomb;
            };

            const highlightElement = function (key) {
                if (elements[key] !== undefined && elements[key].getStatus() === 'new') {
                    const htmlElement = document.getElementById(key);
                    htmlElement.style.borderColor = '#9D9392';
                    marked.push(htmlElement);
                }
            };

            const resetHighlight = function () {
                marked.forEach(function (element) {
                    element.style.borderColor = '';
                });
                marked = [];
            };

            const getNeighbourNumber = function (key) {
                return getNeighborKeys(key).filter(function (neighbor) {
                    return isElementBomb(neighbor);
                }).length;
            };

            const isElementMarked = function (key) {
                if (elements[key] !== undefined && elements[key].getStatus() === 'marked') {
                    return 1;
                }

                return 0;
            };

            const getMarkedNumber = function (key) {
                return getNeighborKeys(key).filter(function (element) {
                    return isElementMarked(element);
                }).length;
            };


            const isNotCorrectBomb = function (key) {
                if (elements[key] === undefined) {
                    return 0;
                }
                if (elements[key].isBomb === true
                    && elements[key].getStatus() !== 'marked') {
                    return 1;
                }

                return 0;
            };

            const getMarkedNeighborsCorrect = function (key) {

                return !getNeighborKeys(key).filter(function (neighbor) {
                    return isNotCorrectBomb(neighbor);
                }).length;
            };


            return {
                resetElements: function () {
                    // empty elements reset
                    empty = [];

                    // empty array just in case
                    elements = {};

                    let i, j, key;
                    for (i = 0; i < xSize; i++) {
                        for (j = 0; j < ySize; j++) {
                            key = arrayToKey(i, j);
                            elements[key] = Object.create(ElementPrototype());
                        }
                    }
                },
                generateElements: function (hotKey) {

                    let i, j, key;

                    const hotKeys = getNeighborKeys(hotKey);
                    hotKeys.push(hotKey);

                    const keys = [];
                    for (i = 0; i < xSize; i++) {
                        for (j = 0; j < ySize; j++) {
                            key = arrayToKey(i, j);
                            keys.push(key);
                        }
                    }

                    // adding bombs
                    for (i = 0; i < nrBombs; i++) {
                        const rand = Math.round(Math.random() * (keys.length - 1));
                        if (hotKeys.indexOf(keys[rand]) !== -1) {
                            i--;
                            continue;
                        }
                        elements[keys[rand]].isBomb = true;
                        keys[rand] = keys[keys.length - 1];
                        keys.pop();
                    }

                    // nr of neighbours
                    for (key in elements) {
                        if (elements.hasOwnProperty(key)) {
                            elements[key].neighbours = getNeighbourNumber(key);
                            const domElement = document.getElementById(key);
                            domElement.style.color = getTextColor(elements[key].neighbours);
                        }
                    }

                },
                getElement: function (key) {
                    if (elements[key] !== undefined) {
                        return elements[key];
                    }

                    return false;
                },
                highlightElements: function (keys) {
                    keys.forEach(function (key) {
                        highlightElement(key);
                    });
                },
                resetHighlight: function () {
                    resetHighlight();
                },
                getMarkedNumber: function (key) {
                    return getMarkedNumber(key);
                },
                isElementBomb: function (key) {
                    return isElementBomb(key);
                },
                clearEmptyNeighbourElements: function (key) {
                    return clearEmptyNeighbourElements(key);
                },
                getMarkedNeighborsCorrect: function (key) {
                    return getMarkedNeighborsCorrect(key);
                }
            };
        }());
        const keyToArray = function (key) {
            const arr = key.match(/\d+/g);
            return {x: parseInt(arr[0], 10), y: parseInt(arr[1], 10)};
        };
        const arrayToKey = function (x, y) {
            return 'e' + x + 'x' + y;
        };
        const getNeighborKeys = function (key) {
            const el = keyToArray(key);

            return [
                arrayToKey(el.x - 1, el.y - 1),
                arrayToKey(el.x - 1, el.y),
                arrayToKey(el.x - 1, el.y + 1),
                arrayToKey(el.x, el.y - 1),
                arrayToKey(el.x, el.y + 1),
                arrayToKey(el.x + 1, el.y - 1),
                arrayToKey(el.x + 1, el.y),
                arrayToKey(el.x + 1, el.y + 1)
            ];
        };
        const finished = function () {

            removeInterval();

            let i, j;
            for (i = 0; i < xSize; i++) {
                for (j = 0; j < ySize; j++) {
                    const el = elementsManager.getElement(arrayToKey(i, j));
                    if (el.getStatus() === 'new') {
                        if (el.isBomb === true) {
                            el.setStatus('marked');
                            nrBombsMarked++;
                        } else {
                            el.setStatus('empty');
                        }
                    }
                }
            }

            updateCanvas();

            menuManager.displayMenu('You win!', 'reset');

            inGame = false;

        };
        const checkFinished = function () {
            let finish = true;

            // check elements that are not bombs and are new or marked
            let i, j;
            finishedLoop:
                for (i = 0; i < xSize; i++) {
                    for (j = 0; j < ySize; j++) {
                        const el = elementsManager.getElement(arrayToKey(i, j));
                        if (el.isBomb === false && (el.getStatus() === 'new' || el.getStatus() === 'marked')) {
                            finish = false;
                            break finishedLoop;
                        }
                    }
                }

            if (finish === true) {
                finished();
            }
        };
        let xSize;
        let ySize;
        const canvasElement = document.getElementById('canvas');

        let nrBombs;
        let nrBombsMarked;
        let interval;
        let counterElement = document.getElementById('counter');
        let seconds;
        let tableElement = null;
        let inGame = false;
        let markMode = false;

        const statusElement = document.getElementById('status');

        const startGame = function () {
            seconds = 0;
            counterElement.innerHTML = '0:00';
            try {
                removeInterval();
            } catch (e) {
            }

            elementsManager.resetElements();

            menuManager.hide();

            generateCanvas();

            inGame = false;
        };

        const initCanvas = function (hotKey) {
            inGame = true;
            elementsManager.generateElements(hotKey);
            initInterval();
        };

        const initInterval = function () {
            interval = setInterval(function () {
                step();
            }, 1000);
        };

        const removeInterval = function () {
            clearInterval(interval);
            interval = null;
        };

        const step = function () {
            ++seconds;
            let time = Math.floor(seconds / 60) + ':';
            const sec = (seconds % 60);
            time += (sec < 10) ? '0' + sec : sec;
            counterElement.innerHTML = time;
        };

        // element right-clicked
        const markBomb = function (key) {

            const element = elementsManager.getElement(key);

            if (element.getStatus() === 'new') {
                element.setStatus('marked');
                nrBombsMarked++;
            } else if (element.getStatus() === 'marked') {
                element.setStatus('new');
                nrBombsMarked--;
            }

            updateCanvas();
        };

        // element clicked
        const showBomb = function (key) {

            const element = elementsManager.getElement(key);

            if (!interval) {
                initCanvas(key);
            }

            if (elementsManager.isElementBomb(key)) {
                gameOver();
                return;
            }

            element.setStatus('empty');

            if (element.neighbours === 0) {
                elementsManager.clearEmptyNeighbourElements(key);
            }

            updateCanvas();
        };

        // clicked center ar both buttons
        const showMarked = function (key) {
            const element = elementsManager.getElement(key);

            if (element.getStatus() !== 'empty') {
                return;
            }

            if (element.neighbours === elementsManager.getMarkedNumber(key)) {
                if (elementsManager.getMarkedNeighborsCorrect(key)) {
                    elementsManager.clearEmptyNeighbourElements(key);
                    updateCanvas();
                } else {
                    gameOver();
                }
            }
        };

        let rightClick = false;
        let leftClick = false;
        let centerClick = false;

        const eventDown = function (e) {

            if (!e) {
                e = window.event;
            }

            if (e.which) {
                // normal browser
                if (e.which === 3) {
                    rightClick = true;
                } else if (e.which === 1) {
                    leftClick = true;
                } else if (e.which === 2) {
                    centerClick = true;
                }


            } else if (e.button) {
                // ie browser
                if (e.button === 2) {
                    rightClick = true;
                } else if (e.button === 1) {
                    leftClick = true;
                } else if (e.button === 3) {
                    rightClick = true;
                    leftClick = true;
                } else if (e.button === 4) {
                    centerClick = true;
                }

            }

            if (centerClick === true || leftClick === true) {
                const key = e.target ? e.target.id : e.srcElement.id;

                elementsManager.highlightElements(getNeighborKeys(key));
            }

            return false;
        };

        const eventUp = function (e) {

            if (!e) {
                e = window.event;
            }

            let clicked;

            if (e.which) {
                // normal browser
                if (e.which === 3) {
                    rightClick = false;
                    clicked = 'right';
                } else if (e.which === 1) {
                    leftClick = false;
                    clicked = 'left';
                } else if (e.which === 2) {
                    centerClick = false;
                    clicked = 'bouth';
                }

            } else if (e.button) {
                // ie browser
                if (e.button === 2) {
                    rightClick = false;
                    clicked = 'right';
                } else if (e.button === 1) {
                    leftClick = false;
                    clicked = 'left';
                } else if (e.button === 3) {
                    rightClick = false;
                    leftClick = false;
                    clicked = 'bouth';
                } else if (e.button === 4) {
                    centerClick = false;
                    clicked = 'bouth';
                }

            }

            if (clicked === 'left' && rightClick === true) {
                rightClick = false;
                clicked = 'bouth';
            } else if (clicked === 'right' && leftClick === true) {
                leftClick = false;
                clicked = 'bouth';
            }

            let el;
            if (e.target) {
                el = e.target.id;
            } else if (e.srcElement) {
                el = e.srcElement.id;
            }

            switch (clicked) {
                case 'left':
                    if (markMode && interval) {
                        markBomb(el);
                    } else {
                        showBomb(el);
                    }
                    showMarked(el);
                    break;
                case 'right':
                    markBomb(el);
                    break;
                case 'bouth':
                    showMarked(el);
                    break;
            }

            elementsManager.resetHighlight();

            checkFinished();

            return false;
        };

        const getTextColor = (function () {
            const colors = {
                i1: '#000000',
                i2: '#0000FF',
                i3: '#00FFFF',
                i4: '#00FF00',
                i5: '#00FF00',
                i6: '#00FF00',
                i7: '#FF0000'
            };

            return function (index) {
                return colors['i' + index];
            };
        }());

        const updateBombLabel = function () {
            statusElement.innerHTML = nrBombsMarked + '/' + nrBombs;
        };

        const generateCanvas = function () {
            canvasElement.innerHTML = '';

            canvasElement.className = '';

            const canvasFragment = document.createDocumentFragment();

            tableElement = document.createElement('table');
            tableElement.id = 'table-elements';
            canvasFragment.appendChild(tableElement);

            const tbody = document.createElement('tbody');
            tableElement.appendChild(tbody);

            let i, j;
            const falseFunc = function () {
                return false;
            };

            for (i = 0; i < xSize; i++) {
                const tr = document.createElement('tr');
                tr.onclick = falseFunc;
                tr.oncontextmenu = falseFunc;
                tbody.appendChild(tr);
                for (j = 0; j < ySize; j++) {
                    const td = document.createElement('td');
                    tr.appendChild(td);
                    td.innerHTML = '&nbsp;';
                    td.id = arrayToKey(i, j);
                    td.className = 'new';

                    td.onclick = falseFunc;
                    td.onmousedown = eventDown;
                    td.onmouseup = eventUp;
                    td.ondblclick = falseFunc;
                    td.oncontextmenu = falseFunc;
                    td.setAttribute("unselectable", "on");

                }
            }

            canvasElement.appendChild(canvasFragment);

            updateBombLabel();
        };

        const updateCanvas = function () {
            let i, j;
            for (i = 0; i < xSize; i++) {
                for (j = 0; j < ySize; j++) {
                    let key = arrayToKey(i, j);

                    let element = elementsManager.getElement(key);

                    if (element.getModified()) {
                        const htmlElement = document.getElementById(key);
                        htmlElement.className = element.getStatus();
                        if (element.isBomb === false && element.neighbours > 0 && element.getStatus() === 'empty') {
                            htmlElement.innerHTML = element.neighbours.toString();
                        }
                        element.resetModified();
                    }
                }
            }

            updateBombLabel();

        };

        const gameOver = function () {

            removeInterval(interval);

            const tds = canvasElement.getElementsByTagName('td');
            let i, j;
            const falseFunc = function () {
                return false;
            };

            for (i = 0; i < tds.length; i++) {
                tds[i].onmousedown = falseFunc;
                tds[i].onmouseup = falseFunc;
            }

            // display exploded bombs
            for (i = 0; i < xSize; i++) {
                for (j = 0; j < ySize; j++) {
                    const key = arrayToKey(i, j);

                    const el = elementsManager.getElement(key);
                    if (el.isBomb === true) {
                        el.setStatus('exploded');
                    }
                }
            }

            updateCanvas();

            menuManager.displayMenu('You died... :(', 'reset');

            inGame = false;
        };


        // method for creating objects
        const ElementPrototype = function () {
            let modified = false;
            let status = 'new';

            return {
                setStatus: function (stat) {
                    status = stat;
                    modified = true;
                },
                getStatus: function () {
                    return status;
                },
                resetModified: function () {
                    modified = false;
                },
                getModified: function () {
                    return modified;
                },
                isBomb: false,
                neighbours: 0
            };
        };


        return {
            startGame: function (x, y, bombs) {
                xSize = x;
                ySize = y;
                nrBombs = bombs;
                nrBombsMarked = 0;

                startGame();
            },
            reset: function () {
                removeInterval();
                inGame = false;
                menuManager.displayMenu('Start fresh?', 'reset');
            },
            pause: function () {

                if (!inGame) {
                    return;
                }

                if (interval) {
                    removeInterval();
                    canvasElement.style.visibility = 'hidden';
                    menuManager.pauseOn();
                    return true;
                } else {
                    initInterval();
                    canvasElement.style.visibility = 'visible';
                    menuManager.pauseOff();
                    return false;
                }

            },
            toggleMode: function () {
                return markMode = !markMode;
            }
        };
    }());

    const getLevelValues = function () {
        return {
            x: parseInt(localStorage.getItem('mines-x'), 10),
            y: parseInt(localStorage.getItem('mines-y'), 10),
            bombs: parseInt(localStorage.getItem('mines-elements'), 10)
        }
    };

    const resetGame = function () {
        const values = getLevelValues();
        Game.startGame(values.x, values.y, values.bombs);
        return false;
    };

    const setCustomValues = function () {
        let xValue, yValue, minesValue;

        if (arguments.length) {
            xValue = arguments[0];
            yValue = arguments[1];
            minesValue = arguments[2];
        } else {
            const x = document.getElementById('x');
            const y = document.getElementById('y');
            const mines = document.getElementById('mines');

            xValue = x.options[x.selectedIndex].value;
            yValue = y.options[y.selectedIndex].value;
            minesValue = mines.options[mines.selectedIndex].value;
        }

        localStorage.setItem('mines-x', xValue);
        localStorage.setItem('mines-y', yValue);
        localStorage.setItem('mines-elements', minesValue);
    };


    [].forEach.call(document.querySelectorAll('.pause-action'), function (element) {
        element.onclick = function () {
            Game.pause();
        };
    });

    document.getElementById('switch-action').onclick = function () {
        if (Game.toggleMode()) {
            document.getElementById('switch-action').getElementsByTagName("div")[0].className = "mark-flag";
        } else {
            document.getElementById('switch-action').getElementsByTagName("div")[0].className = "mark-explode";
        }
    };

    document.getElementById('new-game').onclick = function () {
        resetGame();
    };

    document.getElementById('different-level').onclick = function () {
        document.getElementById('reset-options').style.display = 'none';
        document.getElementById('type-options').style.display = 'block';
    };

    const startGameWithOptions = function () {
        const dataSet = this.dataset;

        if (dataSet.x && dataSet.y && dataSet.bombs) {
            setCustomValues(dataSet.x, dataSet.y, dataSet.bombs);
        } else {
            setCustomValues();
        }

        resetGame();
    };

    [].forEach.call(document.querySelectorAll('.option-start'), function (element) {
        element.onclick = startGameWithOptions;
    });


    document.getElementById('option-custom').onclick = function () {
        document.getElementById('custom-options').style.display = 'block';
    };

    document.getElementById('custom-options-cancel').onclick = function () {
        document.getElementById('custom-options').style.display = 'none';
    };

    document.getElementById('reset').onclick = function () {
        Game.reset();
    };

    window.onload = function () {
        const values = getLevelValues();

        if (values.x && values.y && values.bombs) {
            resetGame();
        }
    };

}());