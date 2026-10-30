import type {FC} from 'react';
import {AbsoluteFill,CanvasImage,staticFile} from 'remotion';
import '../../shared/stoic-fonts';
export const TinyDinoHomecomingThumbnail:FC=()=> <AbsoluteFill style={{background:'#174a4b',fontFamily:'Stoic Sans, sans-serif'}}>
  <CanvasImage src={staticFile('tiny-dino-homecoming/images/08-nest.png')} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
  <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(10,51,55,.94),rgba(10,51,55,.68) 30%,transparent 59%)'}}/>
  <div style={{position:'absolute',left:85,top:92,width:750}}>
    <span style={{display:'inline-block',background:'#ff775f',borderRadius:999,padding:'13px 28px',color:'white',fontWeight:700,fontSize:30,letterSpacing:3}}>TÍ HON • TẬP ĐẦY ĐỦ</span>
    <div style={{marginTop:42,color:'#fff',fontSize:120,fontWeight:700,lineHeight:1.08,textShadow:'0 7px 0 #134b4d'}}>TÌM ĐƯỜNG<br/><span style={{color:'#ffe05a'}}>VỀ TỔ ẤM</span></div>
    <div style={{marginTop:35,color:'#eaffff',fontSize:36,fontWeight:700}}>Từ chiếc trứng nhỏ đến cái ôm của mẹ</div>
  </div>
  <div style={{position:'absolute',left:85,bottom:90,color:'#17434b',background:'#fff3b0',borderRadius:22,padding:'14px 25px',fontSize:30,fontWeight:700}}>TÌNH BẠN & LÒNG DŨNG CẢM</div>
</AbsoluteFill>;
