package com.aal.erp_backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;
    private PaginationInfo pagination;

    // ---------- Constructors ----------
    public ApiResponse() {}

    public ApiResponse(boolean success, T data) {
        this.success = success;
        this.data = data;
    }

    public ApiResponse(boolean success, T data, PaginationInfo pagination) {
        this.success = success;
        this.data = data;
        this.pagination = pagination;
    }

    // ---------- Getters & Setters ----------
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public T getData() { return data; }
    public void setData(T data) { this.data = data; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public PaginationInfo getPagination() { return pagination; }
    public void setPagination(PaginationInfo pagination) { this.pagination = pagination; }

    // ---------- Nested PaginationInfo ----------
    public static class PaginationInfo {
        private int page;
        private int limit;
        private long totalItems;
        private int totalPages;

        public PaginationInfo() {}

        public PaginationInfo(int page, int limit, long totalItems, int totalPages) {
            this.page = page;
            this.limit = limit;
            this.totalItems = totalItems;
            this.totalPages = totalPages;
        }

        // getters & setters
        public int getPage() { return page; }
        public void setPage(int page) { this.page = page; }
        public int getLimit() { return limit; }
        public void setLimit(int limit) { this.limit = limit; }
        public long getTotalItems() { return totalItems; }
        public void setTotalItems(long totalItems) { this.totalItems = totalItems; }
        public int getTotalPages() { return totalPages; }
        public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
    }
}