(function () {

    var Game = (function () {
        var xSize;
        var ySize;
        var canvasElement = document.getElementById('canvas');

        var nrBombs;
        var nrBombsMarked;
        var interval;
        var counterElement = document.getElementById('counter');
        var seconds;
        var tableElement = null;
        var inGame = false;
        var markMode = false;

        var statusElement = document.getElementById('status');

        var startGame = function () {
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

        var initCanvas = function (hotKey) {
            inGame = true;
            elementsManager.generateElements(hotKey);
            initInterval();
        };

        var initInterval = function () {
            interval = setInterval(function () {
                step();
            }, 1000);
        };

        var removeInterval = function () {
            clearInterval(interval);
            interval = null;
        };

        var step = function () {
            ++seconds;
            var time = Math.floor(seconds / 60) + ':';
            var sec = (seconds % 60);
            time += (sec < 10) ? '0' + sec : sec;
            counterElement.innerHTML = time;
        };

        // element right clicked
        var markBomb = function (key) {

            var element = elementsManager.getElement(key);

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
        var showBomb = function (key) {

            var element = elementsManager.getElement(key);

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

        // clicked center ar bouth buttons
        var showMarked = function (key) {
            var element = elementsManager.getElement(key);

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

        var rightClick = false;
        var leftClick = false;
        var centerClick = false;

        var eventDown = function (e) {

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
                var el = keyToArray(e.target ? e.target.id : e.srcElement.id);

                elementsManager.highlightElements([
                    arrayToKey(el.x - 1, el.y - 1),
                    arrayToKey(el.x - 1, el.y),
                    arrayToKey(el.x - 1, el.y + 1),
                    arrayToKey(el.x, el.y - 1),
                    arrayToKey(el.x, el.y + 1),
                    arrayToKey(el.x + 1, el.y - 1),
                    arrayToKey(el.x + 1, el.y),
                    arrayToKey(el.x + 1, el.y + 1)
                ]);
            }

            return false;
        };

        var eventUp = function (e) {

            if (!e) {
                e = window.event;
            }

            var clicked;

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

            var el;
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

        var getTextColor = (function () {
            var colors = {
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

        var updateBombLabel = function () {
            statusElement.innerHTML = nrBombsMarked + '/' + nrBombs;
        };

        var generateCanvas = function () {
            canvasElement.innerHTML = '';

            canvasElement.className = '';

            var canvasFragment = document.createDocumentFragment();

            tableElement = document.createElement('table');
            tableElement.id = 'table-elements';
            canvasFragment.appendChild(tableElement);

            var tbody = document.createElement('tbody');
            tableElement.appendChild(tbody);

            var i, j;
            var falseFunc = function () {
                return false;
            };
            var downFunc = function (e) {
                eventDown(e);
            };
            var upFunc = function (e) {
                eventUp(e);
            };
            for (i = 0; i < xSize; i++) {
                var tr = document.createElement('tr');
                tr.onclick = falseFunc;
                tr.oncontextmenu = falseFunc;
                tbody.appendChild(tr);
                for (j = 0; j < ySize; j++) {
                    var td = document.createElement('td');
                    tr.appendChild(td);
                    td.innerHTML = '&nbsp;';
                    td.id = arrayToKey(i, j);
                    td.className = 'new';

                    td.onclick = falseFunc;
                    td.onmousedown = downFunc;
                    td.onmouseup = upFunc;
                    td.ondblclick = falseFunc;
                    td.oncontextmenu = falseFunc;
                    td.setAttribute("unselectable", "on");

                }
            }

            canvasElement.appendChild(canvasFragment);

            updateBombLabel();
        };

        var updateCanvas = function () {
            var i, j;
            for (i = 0; i < xSize; i++) {
                for (j = 0; j < ySize; j++) {
                    var key = arrayToKey(i, j);

                    var element = elementsManager.getElement(key);

                    if (element.getModified()) {
                        var htmlElement = document.getElementById(key);
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

        var gameOver = function () {

            removeInterval(interval);

            var tds = canvasElement.getElementsByTagName('td');
            var i, j;
            var falseFunc = function () {
                return false;
            };

            for (i = 0; i < tds.length; i++) {
                tds[i].onmousedown = falseFunc;
                tds[i].onmouseup = falseFunc;
            }

            // display exploded bombs
            for (i = 0; i < xSize; i++) {
                for (j = 0; j < ySize; j++) {
                    var key = arrayToKey(i, j);

                    var el = elementsManager.getElement(key);
                    if (el.isBomb === true) {
                        el.setStatus('exploded');
                    }
                }
            }

            updateCanvas();

            menuManager.displayMenu('You died... :(', 'reset');

            inGame = false;
        };

        var checkFinished = function () {
            var finish = true;

            // check elements that are not bombs and are new or marked
            var i, j;
            finishedLoop:
                for (i = 0; i < xSize; i++) {
                    for (j = 0; j < ySize; j++) {
                        var el = elementsManager.getElement(arrayToKey(i, j));
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

        var finished = function () {

            removeInterval();

            var i, j;
            for (i = 0; i < xSize; i++) {
                for (j = 0; j < ySize; j++) {
                    var el = elementsManager.getElement(arrayToKey(i, j));
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

        // method for creating objects
        var ElementPrototype = function () {
            var modified = false;
            var status = 'new';

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

        var arrayToKey = function (x, y) {
            return 'e' + x + 'x' + y;
        };

        var keyToArray = function (key) {
            var arr = key.match(/\d+/g);
            return {x: parseInt(arr[0], 10), y: parseInt(arr[1], 10)};
        };

        var elementsManager = (function () {

            var elements;

            var marked = [];

            var isElementBomb = function (key) {
                return elements[key] !== undefined && elements[key].isBomb;
            };

            var highlightElement = function (key) {
                if (elements[key] !== undefined && elements[key].getStatus() === 'new') {
                    var htmlElement = document.getElementById(key);
                    htmlElement.style.borderColor = '#9D9392';
                    marked.push(htmlElement);
                }
            };

            var resetHighlight = function () {
                marked.forEach(function (element) {
                    element.style.borderColor = '';
                });
                marked = [];
            };

            var getNeighbourNumber = function (key) {
                return getNeighborKeys(key).filter(function (neighbor) {
                    return isElementBomb(neighbor);
                }).length;
            };

            var isElementMarked = function (key) {
                if (elements[key] !== undefined && elements[key].getStatus() === 'marked') {
                    return 1;
                }

                return 0;
            };

            var getMarkedNumber = function (key) {
                return getNeighborKeys(key).filter(function (element) {
                    return isElementMarked(element);
                }).length;
            };

            var clearEmptyElement = function (key) {

                var element = elements[key];

                if (element === undefined || element.isBomb === true || element.getStatus() === 'marked') {
                    return;
                }

                element.setStatus('empty');

                if (element.neighbours === 0) {
                    clearEmptyNeighbourElements(key);
                }
            };

            // for use in clearEmptyNeighbourElements
            var empty;

            var clearEmptyNeighbourElements = function (key) {

                if (empty.indexOf(key) !== -1) {
                    return;
                }

                empty.push(key);

                getNeighborKeys(key).forEach(function (neighbor) {
                    clearEmptyElement(neighbor);
                });

                return true;
            };

            var isNotCorrectBomb = function (key) {
                if (elements[key] === undefined) {
                    return 0;
                }
                if (elements[key].isBomb === true
                    && elements[key].getStatus() !== 'marked') {
                    return 1;
                }

                return 0;
            };

            var getMarkedNeighborsCorrect = function (key) {

                return !getNeighborKeys(key).filter(function (neighbor) {
                    return isNotCorrectBomb(neighbor);
                }).length;
            };

            var getNeighborKeys = function (key) {
                var el = keyToArray(key);

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

            return {
                resetElements: function () {
                    // empty elements reset
                    empty = [];

                    // empty array just in case
                    elements = {};

                    var i, j, key;
                    for (i = 0; i < xSize; i++) {
                        for (j = 0; j < ySize; j++) {
                            key = arrayToKey(i, j);
                            elements[key] = Object.create(ElementPrototype());
                        }
                    }
                },
                generateElements: function (hotKey) {

                    var i, j, key;

                    var hotKeys = getNeighborKeys(hotKey);
                    hotKeys.push(hotKey);

                    var keys = [];
                    for (i = 0; i < xSize; i++) {
                        for (j = 0; j < ySize; j++) {
                            key = arrayToKey(i, j);
                            keys.push(key);
                        }
                    }

                    // adding bombs
                    for (i = 0; i < nrBombs; i++) {
                        var rand = Math.round(Math.random() * (keys.length - 1));
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
                            var domElement = document.getElementById(key);
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

        var menuManager = (function () {

            var menuContainer = document.getElementById('menu-screen');
            var messageContainer = document.getElementById('menu-message');
            var pauseScreen = document.getElementById('pause-screen');
            var pauseImage = document.getElementById('pause-image');

            var options = [];
            options['reset'] = document.getElementById('reset-options');
            options['type'] = document.getElementById('type-options');
            options['custom'] = document.getElementById('custom-options');

            var translucentCanvas = function () {
                canvasElement.className = 'translucent';
            };

            var hideMenus = function () {
                var option;
                menuContainer.style.display = 'none';

                for (option in options) {
                    if (options.hasOwnProperty(option)) {
                        options[option].style.display = 'none';
                    }
                }
            };

            var displayMenu = function (message, menu) {
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

    var getLevelValues = function () {
        return {
            x: parseInt(localStorage.getItem('mines-x'), 10),
            y: parseInt(localStorage.getItem('mines-y'), 10),
            bombs: parseInt(localStorage.getItem('mines-elements'), 10)
        }
    };

    var resetGame = function () {
        var values = getLevelValues();
        Game.startGame(values.x, values.y, values.bombs);
        return false;
    };

    var setCustomValues = function () {
        var xValue, yValue, minesValue;

        if (arguments.length) {
            xValue = arguments[0];
            yValue = arguments[1];
            minesValue = arguments[2];
        } else {
            var x = document.getElementById('x');
            var y = document.getElementById('y');
            var mines = document.getElementById('mines');

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

    var startGameWithOptions = function () {
        var dataSet = this.dataset;

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
        var values = getLevelValues();

        if (values.x && values.y && values.bombs) {
            resetGame();
        }
    };

}());