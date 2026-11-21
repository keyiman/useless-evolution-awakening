import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

const SRC = '提交材料/video-raw/demo.webm';
const OUT = '提交材料/废物进化论_演示视频.mp4';
const TMP = '提交材料/video-raw';
if (!existsSync(SRC)) throw new Error('缺少录屏文件 ' + SRC);
mkdirSync(TMP, { recursive: true });

const font = "C\\:/Windows/Fonts/msyh.ttc";
const fontBold = "C\\:/Windows/Fonts/msyhbd.ttc";
const run = (args) => execFileSync(ffmpeg, args, { stdio: 'inherit' });

// 1. 片头 3s
run([
  '-y',
  '-f', 'lavfi', '-i', 'color=c=0x0d1014:s=1600x1000:d=3:r=25',
  '-vf',
  `drawtext=fontfile='${fontBold}':text='废物进化论':fontcolor=0xf2f4f7:fontsize=110:x=(w-text_w)/2:y=(h-text_h)/2-70,` +
    `drawtext=fontfile='${font}':text='不适者生存':fontcolor=0xe2703a:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2+60,` +
    `drawtext=fontfile='${font}':text='USELESS EVOLUTION':fontcolor=0x6f7883:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2+150`,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', `${TMP}/title.mp4`,
]);

// 2. 片尾 4s
run([
  '-y',
  '-f', 'lavfi', '-i', 'color=c=0x0d1014:s=1600x1000:d=4:r=25',
  '-vf',
  `drawtext=fontfile='${fontBold}':text='同一个种子，同一条路径':fontcolor=0xf2f4f7:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2-90,` +
    `drawtext=fontfile='${font}':text='永远得到同一组结果':fontcolor=0xf2f4f7:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2,` +
    `drawtext=fontfile='${font}':text='Aholo Lux3D G1-Turbo  ·  Three.js  ·  React':fontcolor=0x8b95a1:fontsize=26:x=(w-text_w)/2:y=(h-text_h)/2+120`,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', `${TMP}/outro.mp4`,
]);

// 3. 正片（裁掉开头 1.2s 空白）
run([
  '-y', '-ss', '1.2', '-i', SRC,
  '-vf', 'scale=1600:1000:flags=lanczos,fps=25',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', `${TMP}/body.mp4`,
]);

// 4. 拼接
const list = `${TMP}/concat.txt`;
writeFileSync(list, `file 'title.mp4'\nfile 'body.mp4'\nfile 'outro.mp4'\n`);
run(['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', OUT]);
console.log('done', OUT);
