import puppeteer, { Browser, Page } from "puppeteer";
import fs from 'node:fs';
import path from 'node:path';
import { IFunction } from './../models/IFunction';
import { ExecuteFunctionException } from "./../models/ExecuteFunctionException";
import { ParamNotFoundException } from "./../models/ParamNotFoundException";

export class ImageFunction implements IFunction {
    public name: string;  
    
    private param?: string;
    private folderName: string;
    private folderPath: string;

    constructor() {
        this.name = 'images';
        this.folderName = 'product_images';
        this.folderPath = path.join(process.cwd(), this.folderName);
    }

    public setParam(value: string): void {
      if(value === undefined)
        throw new ParamNotFoundException("This function requires a parameter.")

      this.param = value
    }

    public async executeAsync(): Promise<string> {
        try {
            const browser: Browser = await puppeteer.launch();
            const page: Page = await browser.newPage();
            
            await page.goto(this.param || "");
          
            if (!fs.existsSync(this.folderPath)) 
              fs.mkdirSync(this.folderPath);
          
            const imageUrls: string[] = await page.evaluate(() => {
              const images: NodeListOf<HTMLImageElement> = document.querySelectorAll('.slider--img--D7MJNPZ img');
              const urls: string[] = [];

              images.forEach(img => {
                const imgUrl = img.getAttribute('src')?.replace('_80x80', '')
                urls.push(imgUrl || "");
              });

              return urls;
            });
          
            for (let i = 0; i < imageUrls.length; i++) {
              const imageUrl: string = imageUrls[i];
              const imageName: string = `image_${i}.jpg`;
              const imagePath: string = path.join(this.folderPath, imageName);
              const imageStream = await page.goto(imageUrl);
              
              if(imageStream)
                fs.writeFileSync(imagePath, await imageStream.buffer());
            }
          
            await browser.close();

            return `\x1b[32m${imageUrls.length} downloaded\x1b[0m into ${this.folderPath}`
        }
        catch(error: any) {
            throw new ExecuteFunctionException(error.message)
        }
    }
}