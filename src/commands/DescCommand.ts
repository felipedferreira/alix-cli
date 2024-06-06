import { GenerateContentResult, GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { TitleCommand } from './TitleCommand';
import { ICommand } from './../abstractions/ICommand';


export class DescCommand implements ICommand {
    public url?: string;
    private model: GenerativeModel;

    public get name()
    {
        return 'desc';
    }

    constructor() {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    }

    public async executeAsync(): Promise<string> {
        // TODO: change logic so that we dont have to know this implementation detail!
        const titleCommand: ICommand = new TitleCommand();
        titleCommand.url = this.url
        let productDesc: string;

        try {
            const title = await titleCommand.executeAsync()
            const prompt: string = `${title}. Please write a nice product description based off the title. This is for facebook marketplace.`
            const result: GenerateContentResult = await this.model.generateContent(prompt);
            const response = await result.response;
            productDesc = response.text();
    
        } 
        catch(error: any) {
            console.error("\x1b[32mAn error occured:\x1b[0m", error)
            process.exit(0)
        }

        return `\x1b[32mProduct description (Generative AI):\x1b[0m ${productDesc}`
    }
}