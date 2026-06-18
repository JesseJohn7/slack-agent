import pkg from '@slack/bolt'
const { App } = pkg
import {webClient} from '@slack/web-api'
import {ChatOpenAI} from '@slack/chat-ai'
import {ChatPromptTemplate} from '@slack/chat-prompt-template'
import express from 'express'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const log = {
    info:(msg,...args) => console.log(`[INFO] ${msg}`,...args),
    error:(msg,...args) => console.log(`[ERROR] ${msg}`,...args),
    debug:(msg,...args) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${msg}`,...args),
}

class SlackAIAgent{
    constructor(){
        this.app = express()
        this.slack = new App({ 
        token: process.env.SLACK_BOT_TOKEN,
        signingSecret: process.env.SLACK_SIGNING_SECRET,
        socketMode: true,
        appToken: process.env.SLACK_APP_TOKEN,
        })
    
        this.webClient = new webClient(process.env.SLACK_BOT_TOKEN)
        this.chatAI = new ChatOpenAI({
            model: 'gpt-4',
            temperature: 0.3,
            apiKey: process.env.OPENAI_API_KEY,
        })
        this.setupSlackEvents();
        this.setupExpress();
    }

    setupSlackEvents(){
        this.slack.event('team_join', async ({ event }) => {
           try{
            log.info(`New member joined: ${event.user.real_name ||
                 event.user.name}`)
            const UserInfo = await this.get6Userinfo(event.user.id )
            await this.analyseAndPostMember(userInfo)
        } catch(error){
            log.error('Error processing team_join event', error.message)
           }
        })
 
        this.slack.event('member_joined_channel',async  ({ event }) => { 
            try{
                if (event.channel_type === 'C') {
                    log.info(`Member ${event.user} joined channel ${event.channel}`)
                    const userInfo = await this.getUserInfo(event.user)
                    await this.analyseAndPostMember(user)  
                    
                }

            } catch(error){
                log.error('Error processing member_joined_channel  ', error.message)
            }
        })
           this.slack.error(async (error) => log.error('slack error:', error.message))
    } 
}