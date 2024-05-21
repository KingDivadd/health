# Backend API Documentation

## Introduction

Welcome to the documentation for ohealth backend API.

## Base URL

The base URL for accessing the API is: `https://ohealth-telemedicine-dev-ab664a0cebb8.herokuapp.com/api/v1/`


## Endpoints

## 1    Patient signup => POST =>  `auth/patient-signup`
Patient Registration

*Request Body*
{
    `last_name`:`example_user`,
    `other_names`:`user other names`,
    `email`:`example_david@gmail.com`, 
    `password`:`example`
}

## 2    Signup Edit Patient Data => PATCH  =>  `user/signup-update-patient-data`
Edit Patient data after signing up

*Request Body*
{
    `auth_id`: `The auth id gotten upon signup`
    `last_name`:`Iroegbu`, 
    `other_names`:`Divad`, 
    `gender`:`male`, 
    `date_of_birth`:`2000-10-21`, 
    `avatar`:`https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyJtihp_TGbueW32Z0QMr5kzS1usizL6x95A&usqp=CAU`, 
    `country_code`:`, 
    `phone_number`:`2347044907611`, 
    `referral_code`:`
}

## 3    Verify Patient OTP => POST => `auth/verify-patient-otp`
Verify Patient OTP

*Request Body*
{
    `otp_id`: `The otp id gotten from completing patient profile update`
    `otp`: `054264`
}


## 4    Patient Login => POST => `auth/patient-login`
Patient Login

*Request Body*
{
    `email`:`example.david@gmail.com`,
    `password`: `example`
}

## 5    Generate Patient OTP => POST => `auth/generate-patient-otp`
Generate Patient OTP

*Request Body*
{
    `email`: `email_example@gmail.com`
}


## 6    Re-generate OTP => POST => `auth/regenerate-otp`
`

*Request Body*
{
    `otp_id`: `The same otp_id inteded for otp verification`
    `email`: `email_example@gmail.com`
}

## 7    Reset Patient Password => PATCH => `auth/reset-patient-password`
Reset Patient Password

*Request Body*
{
    `auth_id`: `The auth id`,
    `new_password`: `enter the new password`
}

## 8    Edit Patient Data => PATCH  =>  `user/edit-patient-data`
Edit Patient Data after the patient is verified

*Request Body*
{
    `auth_id`: `The auth id which can be gotten on login`
    `last_name`:`Iroegbu`, 
    `other_names`:`Divad`, 
    `gender`:`male`, 
    `date_of_birth`:`2000-10-21`, 
    `avatar`:`https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyJtihp_TGbueW32Z0QMr5kzS1usizL6x95A&usqp=CAU`, 
    `country_code`:`, 
    `phone_number`:`07044907611`, 
    `referral_code`:`
}

## 10    Physician signup => POST =>  `auth/physician-signup`
Physician Registration

*Request Body*
{
    `last_name`:`example_user`,
    `other_names`:`user other names`,
    `email`:`example_david@gmail.com`, 
    `password`:`example`
}

## 11    Signup Edit Physician Data => PATCH  =>  `user/signup-edit-physician-data`
Edit Physician Data after signing up

*Request Body*
{
    `auth_id`: `The auth id gotten upon signup`
    `last_name`:`Iroegbu`, 
    `other_names`:`David George`, 
    `gender`:`male`, 
    `date_of_birth`:`2000-10-21`, 
    `registered_as`:`, 
    `speciality`:`, 
    `phone_number`:`, 
    `address`:`, 
    `state`:`, 
    `country`:`, 
    `avatar`:`, 
    `medical_license`:`, 
    `professional_credentials`:`, 
    `verification_of_employment`:`
}

## 12    Verify Physician OTP => POST => `auth/verify-physician-otp`
Verify Physician OTP

*Request Body*
{
    `otp_id`: `The otp id gotten from completing physician profile update`
    `otp`: `054264`
}

## 13    Physician Login => POST => `auth/physician-login`
Physician Login

*Request Body*
{
    `email`:`example.david@gmail.com`,
    `password`: `example`
}

## 14    Generate Physician OTP => POST => `auth/generate-physician-otp`
Generate Physician OTP

*Request Body*
{
    `email`: `example_email@gmail.com`
}

## 10    Verify Physician OTP => POST => `auth/verify-physician-otp`
Verify Physician OTP

*Request Body*
{
    `otp_id`: `The otp id`,
    `otp`: `054264`
}

## 11    Reset Physician Password => PATCH => `auth/reset-physician-password`
Reset Physician Password

*Request Body*
{
    `auth_id`: `The auth id`,
    `new_password`: `enter the new password`
}

## 12    Edit Physician Data => PATCH  =>  `user/edit-Physician-data`
Edit Physician Data

*Request Body*
{
    `auth_id`: `The auth id`
    `last_name`:`Iroegbu`, 
    `other_names`:`David George`, 
    `gender`:`male`, 
    `date_of_birth`:`2000-10-21`, 
    `registered_as`:`, 
    `speciality`:`, 
    `phone_number`:`, 
    `address`:`, 
    `state`:`, 
    `country`:`, 
    `avatar`:`, 
    `medical_license`:`, 
    `professional_credentials`:`, 
    `verification_of_employment`:`
}


## 13   Logged In User => POST => `auth/logged-in-user`
Logged in user

*Request Body*
    `auth_id`: `The auth id`
    
## 14   Get All Physicians  => POST => `user/all-physicians`
All Doctors/Physicians

*Request Body*
-   `auth_id`: `The auth id`

## 15   Filter Physicians  => POST => `user/filter-physicians`
Filter or Find Doctors/Physicians

*Request Body*
{
    `auth_id`: `The auth id`,
    `name`: `the physician name`,
    `registered_as`: `what the physician is registered as`,
    `speciality`: `the physician speciality`
}

<!-- for the chat the following criterial must be met -->
<!-- 1.  -->