import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

var isAIReady_ = false;
var isCurrentlyProcessing_ = false;
var pipe = null;

const AIStatusIndicators = {
    loading: document.getElementById("aiStatus-loading"),
    success: document.getElementById("aiStatus-success"),
    error: document.getElementById("aiStatus-error"),
};

function hideEverythingElse(current) {
    for (const key in AIStatusIndicators) {
        AIStatusIndicators[key].style.display =
            key == current ? "flex" : "none";
    }
}

export function isAIReady() {
    return isAIReady_ && !isCurrentlyProcessing_;
}

export async function processAnswer(data) {
    if (!isAIReady_ || isCurrentlyProcessing_) {
        return '';
    }

    try {
        isCurrentlyProcessing_ = true;
        hideEverythingElse("loading");

        const result = await pipe(`Base Prompt: Return answer in single sentence or word, if equation just return the final answer. Data: ${data.join('; ')}`);

        isCurrentlyProcessing_ = false;
        hideEverythingElse("success");

        console.log(result);

        return result;
    } catch (error) {
        isCurrentlyProcessing_ = false;
        hideEverythingElse("error");
        console.error(error);
        return '';
    }
}


async function loadPipeline() {
    try {
        pipe = await pipeline(
            "text-generation",
            "", // ModelName
            {
                cache: true,
            }
        );
        hideEverythingElse("success");

        isAIReady_ = true;
    } catch (error) {
        hideEverythingElse("error");
        console.error(error);
    }
}

loadPipeline();