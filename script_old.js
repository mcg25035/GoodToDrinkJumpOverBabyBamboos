alert("為了更好的遊戲體驗，手機玩家請關閉自動旋轉，如果已經轉了，就讓他轉回來後關掉旋轉重新載入")
var gameGrahpicArea = document.getElementById("game_rendering_area").getContext("2d");

var all_bambooRatHoles = [];
var level = -1
var score = 0
var last_level_up_time = 0;
var x = 0
var last_click_time = 0;
var skip_used = false;
var show_debug_point = false;
var tutorial_done = false;
var whole_game_start = false;
//load a image from /bg.png
var count_loaded = 0;
var current_tutorial_texts = ["點擊畫面以開始遊戲介紹,連點兩下直接開始遊戲","大家好，我就是姑兔君","又來到了一年一度的跳竹筍節","在這個竹筍節你要讓我跳過竹筍","如果你跳不過，我就會被竹筍刺死","電腦按下空白鍵即可讓姑兔君跳躍","手機的話點擊網頁任何一點即可讓姑兔君跳躍","如果要檢查竹筍和姑兔君的碰撞點就按D鍵","準備好跟我一起跳竹筍了嗎","開始瞜！",""]
var current_tutorial_text_index =0;
var bgImage = new Image();
bgImage.src = "./bg.png";
bgImage.onload = ()=>{ count_loaded++ }
var bambooRatHoleZ0 = new Image();
bambooRatHoleZ0.src = "./bamboorat_hole1.png";
bambooRatHoleZ0.onload = ()=>{ count_loaded++ }
var bambooRatHoleZ1 = new Image();
bambooRatHoleZ1.src = "./bamboorat_hole2.png";
bambooRatHoleZ1.onload = ()=>{ count_loaded++ }
var total_time = Date.now()
//load image from /goodToDrink/0~11.png and save it to a list
var goodToDrinkImages = []
for (var i = 0; i < 11; i++) {
    goodToDrinkImages[i] = new Image();
    goodToDrinkImages[i].src = "./goodToDrink/"+ "i" + i + ".png";
}
var gTD_index = 0;
var last_change_gTD_time = 0
var gTD_height = 0;
var gTD_physic_data = {
    acceleration: 0,
    velocity: 15,
}
var gTD_position_data = {
    ul : [0,0],
    ur : [0,0],
    dl : [0,0],
    dr : [0,0]
}

var game_main_timer = {}

function cross(vec1,vec2){
    return vec1[0]*vec2[1] - vec1[1]*vec2[0];
}

function share(){
    if (navigator.share) {
        navigator.share({
          title: '姑兔君跳竹筍',
          text: '我在姑兔君跳竹筍中獲得了' + score + '分，你也來試試吧！',
          url: 'https://BadTimeStories-game-test.mcg25035.repl.co',
        })
          .then()
          .catch((error) => {})
    }
    else{
        if (navigator.clipboard){
            navigator.clipboard.writeText("https://BadTimeStories-game-test.mcg25035.repl.co ; 我在姑兔君跳竹筍中獲得了" + score + "分，你也來試試吧！")
            .then(function() {
                alert("已將分享資訊複製到剪貼簿，到其他社群軟體貼上即可分享")
            })
        }
        else{
            alert("由於瀏覽器不支援分享功能，請自行複製連結，並分享給你的朋友")
        }
    }
}

function isInTriangle(triangle , point){
    //△ABC , and a point P
    var vec_PA = [point[0] - triangle[0][0], point[1] - triangle[0][1]];
    var vec_AB = [triangle[1][0] - triangle[0][0], triangle[1][1] - triangle[0][1]];
    var vec_PB = [point[0] - triangle[1][0], point[1] - triangle[1][1]];
    var vec_BC = [triangle[2][0] - triangle[1][0], triangle[2][1] - triangle[1][1]];
    var vec_PC = [point[0] - triangle[2][0], point[1] - triangle[2][1]];
    var vec_CA = [triangle[0][0] - triangle[2][0], triangle[0][1] - triangle[2][1]];
    var area_tri_PAB = Math.abs(cross(vec_PA, vec_AB)/2);
    var area_tri_PBC = Math.abs(cross(vec_PB, vec_BC)/2);
    var area_tri_PCA = Math.abs(cross(vec_PC, vec_CA)/2);
    var area_tri_ABC = Math.abs(cross(vec_AB, vec_BC)/2);

    if (area_tri_PAB + area_tri_PBC + area_tri_PCA <= area_tri_ABC && area_tri_ABC!=0){
        return true;
    } 
    return false;

}

function gTD_jump(){
    can_press_space = false;
    var physic_timer = setInterval(()=>{
        gTD_physic_data.velocity += window.innerHeight*(gTD_physic_data.acceleration/754)
        gTD_height += window.innerHeight*(gTD_physic_data.velocity/754)
        gTD_physic_data.acceleration -= 0.0035 + 0.0001*level*6
        if (gTD_physic_data.acceleration >= 0.0074){
            gTD_physic_data.acceleration = 0.0074
        }
        if (gTD_height <= 0){
            gTD_height = 0;
            //reset gTD_physic_data
            gTD_physic_data.acceleration = 0;
            gTD_physic_data.velocity = 15;
            clearInterval(physic_timer);
            can_press_space = true;
        }
    },1)    
}


class BambooRatHole{
    constructor(){
        this.x = window.innerWidth
        this.bambooRatHeight = 0
        this.bambooRat = new Image()
        //generate a random number N , 0<=N<=4
        let N = Math.floor(Math.random()*5)
        //if N == 0 or N == 3 , has 0.5*(level**-1) chance to reselect N
        if ((N == 0 || N == 3)&&Math.random() < 0.5*(level**-1)){
            N = Math.floor(Math.random()*5)
        }
        this.bambooRat.src = "./bambooRat" + N + ".png"
        this.bambooRatStatus = "up"
        this.time = 0
        this.timer = {}
        all_bambooRatHoles.push(this)
        //generate a random number R , 0<=R<=0.2
        this.UpAfter = Math.random()
        this.bambooRatTrianglePositionData = [
            [0,0],
            [0,0],
            [0,0]
        ]
        setTimeout(()=>{this.bambooRatUp()}, this.UpAfter*1000)
        
    }
    bambooRatUp(){
        this.timer = setInterval(
            () => {
                if (this.bambooRatStatus == "up"){
                    this.bambooRatHeight += 2.5
                    if (this.bambooRatHeight >= this.bambooRat.height){
                        this.bambooRatStatus = "keep"
                    }
                }
                else if (this.bambooRatStatus == "keep"){
                    this.time += 1
                    if (this.time >= 350){
                        this.bambooRatStatus = "down"
                    }
                }
                else if (this.bambooRatStatus == "down"){
                    this.bambooRatHeight -= 3
                    if (this.bambooRatHeight <= 0){
                        clearInterval(this.timer)
                    }
                }
            }
        ,1)
    }
}

var last_bambooRatHole_generated_time = 0;

var screenSize = {
    width: window.innerWidth,
    height: window.innerHeight
};



function update(){ 
    if (tutorial_done){
        if (last_level_up_time == -1){
            last_level_up_time = Date.now()
            level = 0
        }
        else if (Date.now() - last_level_up_time >= 15000){
            last_level_up_time = Date.now()
            level += 1
        }
        
    }

    


    if (Math.random() < 0.004*(level+1) && Date.now() - last_bambooRatHole_generated_time > 1000-level*10){
        new BambooRatHole
        last_bambooRatHole_generated_time = Date.now()
    }
    

    
    if (x<=-3983*bgImageScale) {
        x = 0;
        return
    }
    x-= window.innerWidth * (6/1464);
    

    gameGrahpicArea.clearRect(0, 0, screenSize.width, screenSize.height);    
    gameGrahpicArea.drawImage(bgImage,x , 0, bgImage.width*bgImageScale, bgImage.height*bgImageScale);
    for (var i = 0; i < all_bambooRatHoles.length; i++) {
        if (!all_bambooRatHoles[i]){
            i++
            continue
        }
        gameGrahpicArea.drawImage(bambooRatHoleZ0,Math.round(all_bambooRatHoles[i].x) ,1015*bgImageScale , bambooRatHoleZ0.width*bgImageScale, bambooRatHoleZ1.height*bgImageScale);
        //draw bamboo rat , not finished
        var thisBambooRat = all_bambooRatHoles[i].bambooRat
        gameGrahpicArea.drawImage(thisBambooRat,(all_bambooRatHoles[i].x+200*bgImageScale)-(thisBambooRat.width/2)*bgImageScale/**bgImageScale*/ , (1055-all_bambooRatHoles[i].bambooRatHeight)*bgImageScale , thisBambooRat.width*bgImageScale, thisBambooRat.height*bgImageScale);
        gameGrahpicArea.drawImage(bambooRatHoleZ1,Math.round(all_bambooRatHoles[i].x) ,1015*bgImageScale , bambooRatHoleZ1.width*bgImageScale, bambooRatHoleZ1.height*bgImageScale);
        all_bambooRatHoles[i].x-= window.innerWidth * (6/1464);
        //update bamboo rat triangle position
        all_bambooRatHoles[i].bambooRatTrianglePositionData[0] = [(all_bambooRatHoles[i].x+200*bgImageScale), (1055-all_bambooRatHoles[i].bambooRatHeight)*bgImageScale]
        all_bambooRatHoles[i].bambooRatTrianglePositionData[1] = [(all_bambooRatHoles[i].x+200*bgImageScale)-(thisBambooRat.width/2)*bgImageScale, (1055-all_bambooRatHoles[i].bambooRatHeight)*bgImageScale+thisBambooRat.height*bgImageScale]
        all_bambooRatHoles[i].bambooRatTrianglePositionData[2] = [(all_bambooRatHoles[i].x+200*bgImageScale)+(thisBambooRat.width/2)*bgImageScale, (1055-all_bambooRatHoles[i].bambooRatHeight)*bgImageScale+thisBambooRat.height*bgImageScale]
        if (show_debug_point){
            gameGrahpicArea.beginPath();
            gameGrahpicArea.fillStyle = "red";
            gameGrahpicArea.arc(all_bambooRatHoles[i].bambooRatTrianglePositionData[0][0], all_bambooRatHoles[i].bambooRatTrianglePositionData[0][1], 5, 0, 2 * Math.PI);
            gameGrahpicArea.fill();
            gameGrahpicArea.beginPath();
            gameGrahpicArea.fillStyle = "red";
            gameGrahpicArea.arc(all_bambooRatHoles[i].bambooRatTrianglePositionData[1][0], all_bambooRatHoles[i].bambooRatTrianglePositionData[1][1], 5, 0, 2 * Math.PI);
            gameGrahpicArea.fill();
            gameGrahpicArea.beginPath();
            gameGrahpicArea.fillStyle = "red";
            gameGrahpicArea.arc(all_bambooRatHoles[i].bambooRatTrianglePositionData[2][0], all_bambooRatHoles[i].bambooRatTrianglePositionData[2][1], 5, 0, 2 * Math.PI);
            gameGrahpicArea.fill();
        }
        
        //debug end
        //if x of this bamboo rat hole lower than zero then delete it from the list
        if (all_bambooRatHoles[i].x <= 0-bambooRatHoleZ0.width*bgImageScale){
            all_bambooRatHoles.splice(i,1)
            i--
            score+=100
        }
    }
    gameGrahpicArea.drawImage(goodToDrinkImages[gTD_index],150*bgImageScale ,(600-gTD_height)*bgImageScale , goodToDrinkImages[gTD_index].width*0.45*bgImageScale, goodToDrinkImages[gTD_index].height*0.45*bgImageScale);
    //good to drink position data update
    gTD_position_data.ul[0] = 150*bgImageScale + goodToDrinkImages[gTD_index].width*0.01*bgImageScale
    gTD_position_data.ul[1] = (600-gTD_height)*bgImageScale
    gTD_position_data.ur[0] = 150*bgImageScale + goodToDrinkImages[gTD_index].width*0.42*bgImageScale
    gTD_position_data.ur[1] = (600-gTD_height)*bgImageScale
    gTD_position_data.dl[0] = 150*bgImageScale + goodToDrinkImages[gTD_index].width*0.16*bgImageScale
    gTD_position_data.dl[1] = (600-gTD_height)*bgImageScale + goodToDrinkImages[gTD_index].height*0.425*bgImageScale
    gTD_position_data.dr[0] = 150*bgImageScale + goodToDrinkImages[gTD_index].width*0.36*bgImageScale
    gTD_position_data.dr[1] = (600-gTD_height)*bgImageScale + goodToDrinkImages[gTD_index].height*0.425*bgImageScale
    
    //for each bamboo rat hole , check if at least one point of gTD is in the triangle , then alert("fail!")
    for (var i = 0; i < all_bambooRatHoles.length; i++) {
        //get the key list of gTD_position_data
        var gTD_position_data_key_list = Object.keys(gTD_position_data)
        //for each key in gTD_position_data_key_list
        for (var j = 0; j < gTD_position_data_key_list.length; j++) {
            //get the point
            var point = gTD_position_data[gTD_position_data_key_list[j]]
            //check if the point is in the triangle
            if (isInTriangle( all_bambooRatHoles[i].bambooRatTrianglePositionData , point)){
                document.getElementById("bg_sound").pause()
                document.getElementById("die").src = "effect_audios/a.mp3"
                document.getElementById("die").play()
                
                clearInterval(game_main_timer)
                setTimeout(()=>{
                    document.getElementById("game_info").hidden = false
                    document.getElementById("level").innerHTML = document.getElementById("level").innerHTML.replaceAll("{}",level)
                    document.getElementById("score").innerHTML = document.getElementById("score").innerHTML.replaceAll("{}",score)
                    
                },1500)
                //reload the page
                //
            }
            
        }
    }
    //debug code
    if (show_debug_point){
        gameGrahpicArea.beginPath();
        gameGrahpicArea.fillStyle = "red";
        gameGrahpicArea.arc(gTD_position_data.ul[0], gTD_position_data.ul[1], 5, 0, 2 * Math.PI);
        gameGrahpicArea.fill();
        gameGrahpicArea.beginPath();
        gameGrahpicArea.fillStyle = "red";
        gameGrahpicArea.arc(gTD_position_data.ur[0], gTD_position_data.ur[1], 5, 0, 2 * Math.PI);
        gameGrahpicArea.fill();
        gameGrahpicArea.beginPath();
        gameGrahpicArea.fillStyle = "red";
        gameGrahpicArea.arc(gTD_position_data.dl[0], gTD_position_data.dl[1], 5, 0, 2 * Math.PI);
        gameGrahpicArea.fill();
        gameGrahpicArea.beginPath();
        gameGrahpicArea.fillStyle = "red";
        gameGrahpicArea.arc(gTD_position_data.dr[0], gTD_position_data.dr[1], 5, 0, 2 * Math.PI);
        gameGrahpicArea.fill();
    }
    

    //if last draw good to drink(gTD) image is more long than 0.05s then change it
    if (last_change_gTD_time < Date.now() - 50){
        gTD_index = (gTD_index+1)%11
        last_change_gTD_time = Date.now()
    }
    
    //render white text "分數 : "+score at the top and right of the screen
    gameGrahpicArea.fillStyle = "white";
    gameGrahpicArea.font = 30*bgImageScale + "px Arial";
    gameGrahpicArea.fillText("分數 : "+score, screenSize.width-300*bgImageScale, 50*bgImageScale);
    gameGrahpicArea.fillText("等級 : "+level, screenSize.width-300*bgImageScale, 100*bgImageScale);
    //render current_tutorial_texts[current_tutorial_text_index] in the bottom of the screen , with bgImageScale argument
    gameGrahpicArea.fillStyle = "white";
    gameGrahpicArea.font = 30*bgImageScale + "px Arial";
    gameGrahpicArea.fillText(current_tutorial_texts[current_tutorial_text_index], screenSize.width/2-300*bgImageScale, screenSize.height-50*bgImageScale);

}

var me = setInterval(()=>{
    if (count_loaded == 3){
        bgImageScale = screenSize.height / bgImage.height;
        game_main_timer = setInterval(update, 10);
        //if player clicked the window , do something
        window.onclick = ()=>{
            current_tutorial_text_index ++
            document.getElementById("gtd_sound").src = "./tutorial_audios/"+(current_tutorial_text_index-1).toString()+".mp3"
            document.getElementById("gtd_sound").play()
            document.getElementById("bg_sound").src = "./bg_audios/tutorial_loop.mp3"
            document.getElementById("bg_sound").play()
            //on bg_sound end , do something
            document.getElementById("bg_sound").onended = ()=>{
                document.getElementById("bg_sound").src = "./bg_audios/intro.mp3"
                document.getElementById("bg_sound").play()
                document.getElementById("bg_sound").onended = ()=>{
                    document.getElementById("bg_sound").src = "./bg_audios/gtd_loop.mp3"
                    document.getElementById("bg_sound").play()
                }
            }
            var tutorial_timer = setInterval(()=>{
                if (current_tutorial_text_index == current_tutorial_texts.length-3){
                    current_tutorial_text_index ++
                    setTimeout(()=>{
                        current_tutorial_text_index ++
                    },800)
                    clearInterval(tutorial_timer)
                    tutorial_done = true
                    document.getElementById("gtd_sound").src = "./tutorial_audios/"+(current_tutorial_text_index-1).toString()+".mp3"
                    document.getElementById("gtd_sound").play()

                    return
                }
                current_tutorial_text_index ++
                document.getElementById("gtd_sound").src = "./tutorial_audios/"+(current_tutorial_text_index-1).toString()+".mp3"
                document.getElementById("gtd_sound").play()
            },3500)
            window.onclick = ()=>{}
            last_click_time = Date.now()
        }
        clearInterval(me)
    }
},1)
can_press_space = true
//when get a space key down , then call gTD_jump()

var can_press_d = true


window.onkeydown = (e)=>{
    if (e.keyCode == 32 && can_press_space){
        gTD_jump()
    }
    if (e.keyCode == 68 && can_press_d){
        show_debug_point = !show_debug_point
    }
}

//when get a left mouse button down , then call gTD_jump()
if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    window.ontouchstart = ()=>{
        if (can_press_space){
            gTD_jump()
        }
        if (!tutorial_done && !skip_used){
            if (Date.now() - last_click_time <= 150){
                current_tutorial_text_index = 8 
                document.getElementById("gtd_sound").src = "./tutorial_audios/"+(current_tutorial_text_index-1).toString()+".mp3"
                document.getElementById("gtd_sound").play() 
                skip_used = true
                document.getElementById("bg_sound").src = "./bg_audios/intro.mp3"
                setTimeout(()=>{
                    document.getElementById("bg_sound").src = "./bg_audios/intro.mp3"
                    document.getElementById("bg_sound").play()
                    document.getElementById("bg_sound").onended = ()=>{
                    document.getElementById("bg_sound").src = "./bg_audios/gtd_loop.mp3"
                    document.getElementById("bg_sound").play()
                    }
                },2500)
            }
        }
        last_click_time = Date.now()
    }
}
else{
    window.onmousedown = (e)=>{
        
        if (e.button == 0 && can_press_space){
            gTD_jump()
        }
        if (!tutorial_done && !skip_used){
            if (Date.now() - last_click_time <= 150){
                current_tutorial_text_index = 8 
                document.getElementById("gtd_sound").src = "./tutorial_audios/"+(current_tutorial_text_index-1).toString()+".mp3"
                document.getElementById("gtd_sound").play() 
                skip_used = true
                setTimeout(()=>{
                    document.getElementById("bg_sound").src = "./bg_audios/intro.mp3"
                    document.getElementById("bg_sound").play()
                    document.getElementById("bg_sound").onended = ()=>{
                        document.getElementById("bg_sound").src = "./bg_audios/gtd_loop.mp3"
                        document.getElementById("bg_sound").play()
                    }
                },2500)
            }
        }
        last_click_time = Date.now()
    }
}



window.onkeyup = (e)=>{
    if (e.keyCode == 68){
        can_press_d = true
    }
}