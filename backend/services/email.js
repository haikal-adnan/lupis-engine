import * as tencentcloud from "tencentcloud-sdk-nodejs-ses";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const SesClient = tencentcloud.ses.v20201002.Client;

const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: process.env.TENCENT_REGION || "ap-singapore",
  profile: {
    httpProfile: {
      endpoint: "ses.tencentcloudapi.com",
    },
  },
};

const client = new SesClient(clientConfig);

export const sendOTPEmail = async (targetEmail, userName, otpCode) => {
  console.log("Using Template ID:", process.env.TENCENT_SES_TEMPLATE_ID);

  const templateId = parseInt(process.env.TENCENT_SES_TEMPLATE_ID, 10);

  if (isNaN(templateId)) {
    return { success: false, error: "Template ID is missing or not a number in .env" };
  }

  const params = {
    FromEmailAddress: process.env.TENCENT_SES_SENDER,
    Destination: [targetEmail],
    Subject: "Verification Code",
    Template: {
      TemplateID: templateId,
      TemplateData: JSON.stringify({
        USER_NAME: userName,
        OTP_CODE: otpCode,
      }),
    },
  };

  try {
    const result = await client.SendEmail(params);
    return { success: true, data: result };
  } catch (error) {
    console.error("SES SDK Error Details:", error);
    return { success: false, error: error.message };
  }
};