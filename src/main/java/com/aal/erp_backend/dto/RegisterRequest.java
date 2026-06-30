package com.aal.erp_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RegisterRequest {

    private String email;
    private String password;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("company_name")
    private String companyName;

    @JsonProperty("customer_type")
    private String customerType;

    private String phone;
    private String address;
    private String city;
    private String state;
    private String pincode;

    @JsonProperty("gst_number")
    private String gstNumber;

    // ---- Getters and Setters ----

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getCustomerType() { return customerType; }
    public void setCustomerType(String customerType) { this.customerType = customerType; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
}