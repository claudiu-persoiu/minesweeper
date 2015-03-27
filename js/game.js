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
        var pauseScreen = document.getElementById('pause-screen');
        var pauseImage = document.getElementById('pause-image');
        var inGame = false;

        var statusElement = document.getElementById('status');

        var startGame = function () {
            seconds = 0;
            counterElement.innerHTML = '0:00';
            try {
                clearInterval(interval);
                interval = null;
            } catch(e) {}

            elementsManager.resetElements();

            pauseScreen.style.display = 'none';

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
            interval = setInterval(function () { step(); }, 1000);
        };

        var step = function () {
            ++seconds;
            var time = Math.floor(seconds / 60) + ':';
            var sec = (seconds % 60);
            time += (sec < 10)? '0' + sec : sec;
            counterElement.innerHTML = time;
        };

        // element right clicked
        var markBomb = function (key) {

            var element = elementsManager.getElement(key);

            if(element.getStatus() === 'new') {
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
                return ;
            }

            element.setStatus('empty');

            if(element.neighbours === 0) {
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
                if(e.which === 3) {
                    rightClick = true;
                } else if(e.which === 1) {
                    leftClick = true;
                } else if(e.which === 2) {
                    centerClick = true;
                }


            } else if (e.button) {
                // ie browser
                if(e.button === 2) {
                    rightClick = true;
                } else if(e.button === 1) {
                    leftClick = true;
                } else if(e.button === 3) {
                    rightClick = true;
                    leftClick = true;
                } else if(e.button === 4) {
                    centerClick = true;
                }

            }

            if(centerClick === true || leftClick === true) {
                var el = keyToArray(e.target ? e.target.id : e.srcElement.id);

                elementsManager.markElements([
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
                if(e.which === 3) {
                    rightClick = false;
                    clicked = 'right';
                } else if(e.which === 1) {
                    leftClick = false;
                    clicked = 'left';
                } else if(e.which === 2) {
                    centerClick = false;
                    clicked = 'bouth';
                }

            } else if (e.button) {
                // ie browser
                if(e.button === 2) {
                    rightClick = false;
                    clicked = 'right';
                } else if(e.button === 1) {
                    leftClick = false;
                    clicked = 'left';
                } else if(e.button === 3) {
                    rightClick = false;
                    leftClick = false;
                    clicked = 'bouth';
                } else if(e.button === 4) {
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

            switch(clicked) {
                case 'left':
                    showBomb(el);
                    showMarked(el);
                    break;
                case 'right':
                    markBomb(el);
                    break;
                case 'bouth':
                    showMarked(el);
                    break;
            }

            elementsManager.resetMarked();

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
            var falseFunc = function () { return false; };
            var downFunc = function (e) { eventDown(e); };
            var upFunc = function (e) { eventUp(e); };
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

                    if(element.getModified()) {
                        //console.log(key);
                        var htmlElement = document.getElementById(key);
                        htmlElement.className = element.getStatus();
                        if(element.isBomb === false && element.neighbours > 0 && element.getStatus() === 'empty') {
                            htmlElement.innerHTML = element.neighbours.toString();
                        }
                        element.resetModified();
                    }
                }
            }

            updateBombLabel();

        };

        var gameOver = function () {

            clearInterval(interval);

            var tds = canvasElement.getElementsByTagName('td');
            var i,j;
            var falseFunc = function () { return false; };
            for (i = 0; i < tds.length; i++) {
                tds[i].onmousedown = falseFunc;
                tds[i].onmouseup = falseFunc;
            }

            // display exploded bombs
            for(i = 0; i < xSize; i++) {
                for(j = 0; j < ySize; j++) {
                    var key = arrayToKey(i, j);

                    var el = elementsManager.getElement(key);
                    if(el.isBomb === true) {
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
                for(i = 0; i < xSize; i++) {
                    for(j = 0; j < ySize; j++) {
                        var el = elementsManager.getElement(arrayToKey(i, j));
                        if(el.isBomb === false && (el.getStatus() === 'new' || el.getStatus() === 'marked')) {
                            finish = false;
                            break finishedLoop;
                        }
                    }
                }

            if(finish === true) {
                finished();
            }
        };

        var finished = function () {

            clearInterval(interval);

            var i, j;
            for(i = 0; i < xSize; i++) {
                for(j = 0; j < ySize; j++) {
                    var el = elementsManager.getElement(arrayToKey(i, j));
                    if(el.getStatus() === 'new') {
                        if(el.isBomb === true) {
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

        var translucentCanvas = function () {
            canvasElement.className = 'translucent';
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

            var markElement = function (key) {
                if (elements[key] !== undefined && elements[key].getStatus() === 'new') {
                    document.getElementById(key).style.borderColor = '#9D9392';
                    marked.push(key);
                }

            };

            var resetMarked = function () {
                var key;
                for(key in marked) {
                    if(marked.hasOwnProperty(key)) {
                        document.getElementById(marked[key]).style.borderColor = '';
                    }
                }
                marked = [];
            };

            var getNeighbourNumber = function (key) {
                var i, nr = 0;

                var neighborKeys = getNeighborKeys(key);

                for (i = 0; i < neighborKeys.length; i++) {
                    nr += isElementBomb(neighborKeys[i]);
                }

                return nr;
            };

            var isElementMarked = function (key) {
                if (elements[key] !== undefined && elements[key].getStatus() === 'marked') {
                    return 1;
                }

                return 0;
            };

            var getMarkedNumber = function (key) {
                var i, marked = 0;

                var neighborKeys = getNeighborKeys(key);

                for (i = 0; i < neighborKeys.length; i++) {
                    marked += isElementMarked(neighborKeys[i]);
                }

                return marked;
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

                if(empty.indexOf(key) !== -1) {
                    return ;
                }

                empty.push(key);

                var i;
                var neighborKeys = getNeighborKeys(key);

                for (i = 0; i < neighborKeys.length; i++) {
                    clearEmptyElement(neighborKeys[i]);
                }

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
                var i, marked = 0;

                var neighborKeys = getNeighborKeys(key);

                for (i = 0; i < neighborKeys.length; i++) {
                    marked += isNotCorrectBomb(neighborKeys[i]);
                }

                // if marked is 0 then is all elements are marked correct
                return marked ? false : true;

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
                        for(j = 0; j < ySize; j++) {
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
                        for(j = 0; j < ySize; j++) {
                            key = arrayToKey(i, j);
                            keys.push(key);
                        }
                    }

                    // adding bombs
                    for (i = 0; i < nrBombs; i++) {
                        var rand = Math.round(Math.random() * (keys.length - 1));
                        if (hotKeys.indexOf(keys[rand]) !== -1) {
                            i--;
                            continue ;
                        }
                        elements[keys[rand]].isBomb = true;
                        keys[rand] = keys[keys.length - 1];
                        keys.pop();
                    }

                    // nr of neighbours
                    for (key in elements) {
                        if(elements.hasOwnProperty(key)) {
                            elements[key].neighbours = getNeighbourNumber(key);
                            var domElement = document.getElementById(key);
                            domElement.style.color = getTextColor(elements[key].neighbours);
                        }
                    }

                },
                getElement: function (key) {
                    if(elements[key] !== undefined) {
                        return elements[key];
                    }

                    return false;
                },
                markElements: function (keys) {
                    var key;
                    for(key in keys) {
                        if(keys.hasOwnProperty(key)) {
                            markElement(keys[key]);
                        }
                    }
                },
                resetMarked: function () {
                    resetMarked();
                },
                getMarkedNumber: function  (key) {
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
            var options = [];
            options['reset'] = document.getElementById('reset-options');
            options['type'] = document.getElementById('type-options');
            options['custom'] = document.getElementById('custom-options');


            var hideMenus = function () {
                var option;
                menuContainer.className = '';
                menuContainer.style.display = 'none';
                for(option in options) {
                    if(options.hasOwnProperty(option)) {
                        options[option].style.display = 'none';
                    }
                }
            };

            var displayMenu = function (message, menu) {
                hideMenus();
                messageContainer.innerHTML = message;
                options[menu].style.display = 'block';
                menuContainer.style.display = 'block';

                translucentCanvas();
            };

            return {
                hide: function () {
                    hideMenus();
                },
                displayMenu: function (message, menu) {
                    displayMenu(message, menu);
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
                clearInterval(interval);
                interval = null;
                inGame = false;
                menuManager.displayMenu('Start fresh?', 'reset');
            },
            pause: function() {

                if(!inGame) {
                    return;
                }

                if(interval) {
                    clearInterval(interval);
                    interval = null;
                    tableElement.style.display = 'none';
                    pauseScreen.style.display = 'block';
                    pauseImage.className = 'play';
                    return true;
                } else {
                    initInterval();
                    tableElement.style.display = '';
                    pauseScreen.style.display = 'none';
                    pauseImage.className = 'pause';
                    return false;

                }

            }
        };
    }());

    var level = (function () {

        return {
            getValues: function () {
                return {
                    x: parseInt(localStorage.getItem('mines-x'), 10),
                    y: parseInt(localStorage.getItem('mines-y'), 10),
                    bombs: parseInt(localStorage.getItem('mines-elements'), 10)
                }
            }
        };
    }());

    var resetGame = function () {
        var values = level.getValues();
        Game.startGame(values.x, values.y, values.bombs);
        return false;
    };

    var setCustomValues = function () {
        if(arguments.length) {
            var xValue = arguments[0];
            var yValue = arguments[1];
            var minesValue = arguments[2];
        } else {
            var x = document.getElementById('x');
            var y = document.getElementById('y');
            var mines = document.getElementById('mines');

            var xValue = x.options[x.selectedIndex].value;
            var yValue = y.options[y.selectedIndex].value;
            var minesValue = mines.options[mines.selectedIndex].value;
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

    document.getElementById('new-game').onclick = function () {
        resetGame();
    };

    document.getElementById('different-level').onclick = function () {
        document.getElementById('reset-options').style.display = 'none';
        document.getElementById('type-options').style.display = 'block';
    };

    var startGameWithOptions = function () {
        var dataSet = this.dataset;

        if(dataSet.x && dataSet.y && dataSet.bombs) {
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
        document.getElementById('custom-options').style.display='block';
    };

    document.getElementById('custom-options-cancel').onclick = function () {
        document.getElementById('custom-options').style.display='none';
    };

    document.getElementById('reset').onclick = function () {
        Game.reset();
    };

    window.onload = function () {
        var values = level.getValues();

        if(values.x && values.y && values.bombs) {
            resetGame();
        }
    };

}());