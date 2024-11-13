phina.globalize();

const version = "1.0";


phina.define('MainScene', {
    superClass: 'DisplayScene',
    init: function(param/*{}*/) {
        this.superInit(param);

        const self = this;

        this.backgroundColor = "PeachPuff";

        let handColor = "empty";
        let handColorLastPosition = {x: null, y: null};

        const stones = new Stones();

        // 最初の地の数
        let areaCnt = 0;

        const data = kifu;//[0];
        for (let y = 0; y < data.length; y++) {
            const rows = data[y].split("");
            for (let x = 0; x < rows.length; x++) {

                let color;

                if (rows[x] === "1") {
                    color = "black";
                } else if (rows[x] === "2") {
                    color = "blackArea";
                } else if (rows[x] === "5") {
                    color = "white";
                } else {
                    color = "empty";
                    areaCnt += 1;
                }

                if (color !== "empty") {
                    stones.putStone(color, x, y);
                }
            }
        };

        // コメント表示
        const commentBox = LabelArea({
            width: this.width - 50,
            height: 300,
            text: "白地を整地してください。石をクリックして取ったら、移動したい場所をクリックします。\n（移動できない石もあります）",
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(6.5));


        function judge() {

            let comment = "";
            const result = stones.judge();

            // とりあえず地の数が違っていたらだめ
            if (goban.groupShapesCnt() !== areaCnt) {
                comment = "地の境界があいまいになっているようです…。黒石と白石を入れ替えて、境界をはっきりさせておきましょう！";
            } else if (result.tyouhoukeiNG > 1) {
                comment = "できるだけ長方形になるようにしましょう！";
            } else if (result.baisuNG > 1) {
                comment = "できるだけ５の倍数になるようにしましょう！";
            } else {
                comment = "すばらしい！";
            }
            commentBox.text = comment;
        }

        const stoneClickCallback = function(x, y, stoneShape) {

            const clickedColor = stones.getColor(x, y);

            // 黒石をクリックした場合
            if (clickedColor === "black") {

                // 既に石を持っているなら、なにも起きない
                if (handColor !== "empty") {
                    purupuru(stoneShape);
                    return;
                }

                // 黒石を取れるのは、呼吸点を持つ黒石の場合のみ
                if (stones.hasKokyuten(x, y) === false) {
                    purupuru(stoneShape);
                    return;
                }

                // タップした石を手に持つ
                handColor = clickedColor;
                handColorLastPosition = {x: x, y: y};
                stones.removeStone(x, y);
                goban.drawStones(stones);
                goban.createHandStone("black", x, y).then(function() {
                    const groups = stones.group();
                    goban.drawWhiteArea(groups);
                });

                return;
            }


            // 白石をクリックした場合
            if (clickedColor === "white") {
                // 石を持っていないなら、タップした白石を持つ
                if (handColor === "empty") {
        
                    // ただし、呼吸点を持たない石はダメ
                    if (stones.hasKokyuten(x, y) === false) {
                        purupuru(stoneShape);
                        return;
                    }
    
                    handColor = clickedColor;
                    handColorLastPosition = {x: x, y: y};
                    stones.removeStone(x, y);
                    goban.drawStones(stones);
                    goban.createHandStone("white", x, y).then(function() {
                        const groups = stones.group();
                        goban.drawWhiteArea(groups);
                    });

                } else if (handColor === "black") {
                    // 黒石を持っている場合、呼吸点を持たない白石となら交換可能
                    if (stones.hasKokyuten(x, y) === true) {
                        purupuru(stoneShape);
                        return;
                    }
                    stones.removeStone(x, y);
                    goban.drawStones(stones);

                    goban.moveStone("white", x, y, handColorLastPosition.x, handColorLastPosition.y)
                    .then(function() {
                        stones.putStone("white", handColorLastPosition.x, handColorLastPosition.y);
                        goban.drawStones(stones);
                        handColor = "empty";
                        handColorLastPosition = {x: null, y: null};
    
                        goban.removeHandStone(x, y).then(function() {
                            stones.putStone("black", x, y);
                            goban.drawStones(stones);
                            const groups = stones.group();
                            goban.drawWhiteArea(groups);
                            judge();
                        });
                    });
    

                } else {
                    // 白石をクリックしてもなにも起きない
                    purupuru(stoneShape);
                }
            }

            // 空点をクリックした場合
            if (clickedColor === "empty") {

                // 石を持っていないならなにも起きない
                if (handColor === "empty") {
                    return;
                }

                // 黒石を置くことはできない、ただし元の位置になら置ける
                if (handColor === "black" && !(x === handColorLastPosition.x && y === handColorLastPosition.y)) {
                    return;
                }

                goban.removeHandStone(x, y).then(function() {
                    // 持っている石を置く
                    stones.putStone(handColor, x, y);
                    handColor = "empty";
                    handColorLastPosition = {x: null, y: null};

                    goban.drawStones(stones);
                    const groups = stones.group();
                    goban.drawWhiteArea(groups);
                    judge();
                });
            }

            function purupuru(stone) {
                stone.tweener
                .by({x: -8}, 50).by({x: 16}, 50).by({x: -16}, 50).by({x: 8}, 50)
                .by({x: -4}, 50).by({x: 8}, 50).by({x: -8}, 50).by({x: 4}, 50)
                .play();
            }


        };
        
        const goban = new Goban(stoneClickCallback);
        goban.ui.addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-2.5));
        goban.drawStones(stones);

        const groups = stones.group();
        goban.drawWhiteArea(groups);

        // const button = BasicButton({
        //     text: "できた",
        //     width: 200,
        //     height: 80,
        // }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(5));
        // button.setInteractive(true);
        // button.on("pointstart", function() {
        //     const groups = stones.group();
        //     goban.drawWhiteArea(groups);
        // });

    },
});


// 碁盤
const Goban = function(stoneClickCallback) {

    const self = this;

    self.ui = RectangleShape({
        fill: "DarkGoldenrod",
        strokeWidth: 0,
        width: 630,
        height: 630,
    });

    const grid = Grid({width: self.ui.width - 50, columns: 12});

    const stoneShapes = [];
    const groupShapes = [];

    self.groupShapesCnt = function() {
        return groupShapes.length;
    };

    (13).times(function(spanX) {
        var startPoint = Vector2((spanX - 6) * grid.unitWidth, -1 * grid.width/2),
            endPoint = Vector2((spanX - 6) * grid.unitWidth, grid.width/2);
        
        PathShape({paths:[startPoint, endPoint], stroke: "#111", strokeWidth: 2}).addChildTo(self.ui);
    });

    (13).times(function(spanY) {
        var startPoint = Vector2(-1 * grid.width/2, (spanY - 6) * grid.unitWidth),
            endPoint = Vector2(grid.width/2, (spanY - 6) * grid.unitWidth);
        
        PathShape({paths:[startPoint, endPoint], stroke: "#111", strokeWidth: 2}).addChildTo(self.ui);
    });

    const createStone = function(color, x, y) {
        if (color === "black" || color === "white" || color === "empty") {

            const stone = CircleShape({
                strokeWidth: 1,
                radius: grid.unitWidth / 2,
                fill: color === "empty" ? "transparent" : color,
                strokeWidth: 0,
            }).addChildTo(self.ui).setPosition(grid.span(x - 6), grid.span(y - 6));
            stoneShapes.push(stone);
    
            stone.setInteractive(true);
            stone.on("pointstart", function() {
                stoneClickCallback(x, y, stone);
            });


        } else if (color === "blackArea") {
            const area = RectangleShape({
                strokeWidth: 0,
                width: Math.ceil(grid.unitWidth),
                height: Math.ceil(grid.unitWidth),
                fill: "rgba(0, 0, 0, 0)",
                strokeWidth: 0,
            }).addChildTo(self.ui).setPosition(grid.span(x - 6), grid.span(y - 6));
            stoneShapes.push(area);
        }
    };

    function clearStoneShapes() {
        stoneShapes.forEach(function(stone) {
            stone.remove();
        });
        stoneShapes.length = 0;
    }

    self.drawStones = function(stones) {
        clearStoneShapes();
        stones.stoneMap().forEach(function(stone) {
            createStone(stone.color, stone.x, stone.y);
        });
    };

    self.drawWhiteArea = function(groups) {

        const colors = ["RoyalBlue","Chocolate","DarkMagenta","SeaGreen","Gold","LightCoral","Teal","MidnightBlue","Peru","DarkOliveGreen"];

        groupShapes.forEach(function(area) {
            area.remove();
        });
        groupShapes.length = 0;
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];

            const areaColor = !!colors[i] ? colors[i] : "blue";

            for (let n = 0; n < group.length; n++) {

                const area = RectangleShape({
                    strokeWidth: 0,
                    width: grid.unitWidth + 1,
                    height: grid.unitWidth + 1,
                    fill: areaColor,
                    strokeWidth: 0,
                }).addChildTo(self.ui).setPosition(grid.span(group[n].x - 6), grid.span(group[n].y - 6));
                area.alpha = 0.8;
                groupShapes.push(area);

            }


        }
    };

    self.handStoneShape = null;

    self.createHandStone = function(color, x, y) {
        return Flow(function(resolve) {
            self.handStoneShape = CircleShape({
                strokeWidth: 1,
                radius: grid.unitWidth / 2,
                fill: color,
                strokeWidth: 0,
            }).addChildTo(self.ui).setPosition(grid.span(x - 6), grid.span(y - 6));
            self.handStoneShape.tweener.to({x: 0, y:350}, 200)
            .call(function() {
                resolve();
            })
            .play();
        });
    };

    self.removeHandStone = function(x, y) {
        return Flow(function(resolve) {
            self.handStoneShape.tweener.to({x: grid.span(x - 6), y:grid.span(y - 6)}, 200)
            .call(function() {
                resolve();
                self.handStoneShape.remove();
            })
            .play();
        });
    };

    self.moveStone = function(color, x1, y1, x2, y2) {
        return Flow(function(resolve) {
            const stone = CircleShape({
                strokeWidth: 1,
                radius: grid.unitWidth / 2,
                fill: color,
                strokeWidth: 0,
            }).addChildTo(self.ui).setPosition(grid.span(x1 - 6), grid.span(y1 - 6));
            stone.tweener.to({x: grid.span(x2 - 6), y:grid.span(y2 - 6)}, 200)
            .call(function() {
                resolve();
                stone.remove();
            })
            .play();
        });
    };

};

const Stones = function() {
    const self = this;

    const stones = {}; // {position("x,y"): color}

    for (let x = 0; x < 13; x++) {
        for (let y = 0; y < 13; y++) {
            stones[x + "," + y] = "empty";
        }
    }

    self.putStone = function(color, x, y) {
        const index = x + "," + y;
        stones[index] = color;
    };

    self.removeStone = function(x, y) {
        const index = x + "," + y;
        stones[index] = "empty";
    };

    self.getColor = function(x, y) {
        const index = x + "," + y;
        return stones[index];
    }

    self.stoneMap = function() {
        const array = [];
        for (let [key, value] of Object.entries(stones)) {
            const x = Number(key.split(",")[0]);
            const y = Number(key.split(",")[1]);
            array.push({color: value, x: x, y: y});
        }
        return array;
    };

    // 呼吸点があるか
    self.hasKokyuten = function (x, y) {

        const top = x + "," + (y - 1);
        if (stones[top] === "empty") {
            return true;
        }

        const under = x + "," + (y + 1);
        if (stones[under] === "empty") {
            return true;
        }

        const right = (x + 1) + "," + y;
        if (stones[right] === "empty") {
            return true;
        }

        const left = (x - 1) + "," + y;
        if (stones[left] === "empty") {
            return true;
        }

        return false;
    };

    self.group = function() {

        // 空点だけを抽出
        const emptyCells = [];
        for (let [key, value] of Object.entries(stones)) {
            if (value === "empty") {
                const x = Number(key.split(",")[0]);
                const y = Number(key.split(",")[1]);
                emptyCells.push({color: value, x: x, y: y});
            }
        }

        const groups = [];

        // 空点が無くなるまでチェック
        while (emptyCells.length > 0) {
            const group = [];
            const isOK = checkCell(group, emptyCells[0].x, emptyCells[0].y);
            if (isOK) {
                groups.push(group);
            }
        }

        // 黒石に触れていないエリアだったならtrueを返す
        function checkCell(group, x, y) {

            const target = getCell(x, y);
            let ok = true;

            if (self.getColor(x, y) === "black") {
                return false;
            }
            
            if (!target) {
                return true;
            }

            group.push(target);

            removeCell(x, y);

            if (checkCell(group, x + 1, y) === false) {
                ok = false;
            };
            if (checkCell(group, x - 1, y) === false) {
                ok = false;
            };
            if (checkCell(group, x, y + 1) === false) {
                ok = false;
            };
            if (checkCell(group, x, y - 1) === false) {
                ok = false;
            };

            function getCell(x, y) {
                return emptyCells.find(cell => cell.x === x && cell.y === y);
            }
    
            function removeCell(x, y) {
                const index = emptyCells.findIndex(cell => cell.x === x && cell.y === y);
                emptyCells.splice(index, 1);
            }

            return ok;
        }

        return groups;

    };


    // 評価
    self.judge = function() {

        const groups = self.group();

        let tyouhoukeiNG = 0;
        let baisuNG = 0;

        for (let i = 0; i < groups.length; i++) {
            if (isTyouhoukei(groups[i]) === false) {
                tyouhoukeiNG += 1;
            }
            if (isBaisu(groups[i]) === false) {
                baisuNG += 1;
            }
        }

        console.log("長方形ではない：", tyouhoukeiNG);
        console.log("５の倍数ではない：", baisuNG);

        return {
            tyouhoukeiNG: tyouhoukeiNG,
            baisuNG: baisuNG,
        };

        // ５の倍数かどうか
        function isBaisu(group) {
            return group.length % 5 === 0;            
        }

        // 長方形かどうか
        function isTyouhoukei(group) {

            // xだけを集める
            const xList = [];
            group.forEach(function(cell) {
                xList.push(cell.x);
            });
            const xMax = xList.reduce(function(a, b) {return Math.max(a, b);})
            const xMin = xList.reduce(function(a, b) {return Math.min(a, b);})

            // yだけを集める
            const yList = [];
            group.forEach(function(cell) {
                yList.push(cell.y);
            });
            const yMax = yList.reduce(function(a, b) {return Math.max(a, b);})
            const yMin = yList.reduce(function(a, b) {return Math.min(a, b);})

            let list;

            // xが最小値である全てのセルのyが、最小値から最大値まで欠けることなく存在すること
            list = group.filter(function(cell) {
                return cell.x === xMin;
            });
            for (let i = yMin; i <= yMax; i++) {
                const tmp = list.find(function(cell) {
                    return cell.y === i;
                });
                if (!tmp) {
                    return false;
                }
            }

            // xが最大値である全てのセルのyが、最小値から最大値まで欠けることなく存在すること
            list = group.filter(function(cell) {
                return cell.x === xMax;
            });
            for (let i = yMin; i <= yMax; i++) {
                const tmp = list.find(function(cell) {
                    return cell.y === i;
                });
                if (!tmp) {
                    return false;
                }
            }

            // yが最小値である全てのセルのxが、最小値から最大値まで欠けることなく存在すること
            list = group.filter(function(cell) {
                return cell.y === yMin;
            });
            for (let i = xMin; i <= xMax; i++) {
                const tmp = list.find(function(cell) {
                    return cell.x === i;
                });
                if (!tmp) {
                    return false;
                }
            }

            // yが最大値である全てのセルのxが、最小値から最大値まで欠けることなく存在すること
            list = group.filter(function(cell) {
                return cell.y === yMax;
            });
            for (let i = xMin; i <= xMax; i++) {
                const tmp = list.find(function(cell) {
                    return cell.x === i;
                });
                if (!tmp) {
                    return false;
                }
            }
        }

    };

};

// 汎用ボタン
phina.define('BasicButton', {
    superClass: 'RectangleShape',
    init: function(param) {
        const self = this;
        this.superInit({
            width: param.width,
            height: param.height,
            fill: "white",
            cornerRadius: 8,
            strokeWidth: 8,
            stroke: "black",
        });
        const label = Label({
            text: param.text,
            fontSize: 25,
            fontWeight: 800,
        }).addChildTo(self);
        self.setInteractive(true);

        if (param.primary) {
            this.strokeWidth = 11;
        }

        self.disable = function () {
            self.stroke = "gray";
            label.fill = "gray";
        };

        self.enable = function () {
            self.stroke = "black";
            label.fill = "black";
        };
    },
});


phina.main(function() {
    App = GameApp({
        // assets: ASSETS,
        startLabel: 'MainScene',
        scenes: [
            {
                label: 'MainScene',
                className: 'MainScene',
            },
        ],
    });

    App.fps = 60;

    App.run();

});

const kifu = [
    "2111222222222",
    "2122112122222",
    "1221551222222",
    "1121151111111",
    "1111155511515",
    "1111111555555",
    "1115511155005",
    "1111551115005",
    "1111511115050",
    "1515515555505",
    "5515055505555",
    "0515000505005",
    "0555555000050",
];
