namespace ensemble {
    let broadcastQueue: BroadcastMessage[] = [];
    const broadcastQueueMaxCutoff = 5;
    
    export interface BroadcastMessage {
        group: number;
        message: number;
    }

    export function queueBroadcastMessage(group: number, message: number) {
        broadcastQueue.push({group, message});
    }

    export function broadcastMessages() {
        let count = 0;
        while (count < broadcastQueueMaxCutoff && broadcastQueue.length > 0) {
            let message = broadcastQueue.shift();
            radio.setGroup(message.group);
            radio.sendNumber(message.message);
            count++;
        }
        
        radio.setGroup(channel);
    }
}