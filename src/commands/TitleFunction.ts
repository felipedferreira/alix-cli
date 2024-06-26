import puppeteer, { Browser, Page } from "puppeteer";
import { IFunction } from './../models/IFunction';
import { ExecuteFunctionException } from './../models/ExecuteFunctionException';
import { ParamNotFoundException } from "../models/ParamNotFoundException";
import { GenerateContentResult, GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";

export class TitleFunction implements IFunction {
    public name: string;
    
    private param?: string;
    private model: GenerativeModel;

    constructor() {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
        this.name = 'title'
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
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
            
            await page.goto(this.param || '');
            
            const title: string = await page.evaluate(() => {
                const titleElement = document.querySelector('h1[data-pl="product-title"]');

                if(!titleElement) 
                    throw Error("No title found.");

                return titleElement.textContent || ""
            });

            await browser.close(); 

            const prompt: string = `Given this product title: ${title}. Re write it and make it between 70-100 characters in length. Do not include any formatting in your answer.`
            const result: GenerateContentResult = await this.model.generateContent(prompt)
            const generatedTitle = await result.response.text()

            return `\x1b[32mProduct title (Generative AI):\x1b[0m ${generatedTitle}`
        }
        catch(error: any) {
            throw new ExecuteFunctionException(error.message)
        }
    }
}