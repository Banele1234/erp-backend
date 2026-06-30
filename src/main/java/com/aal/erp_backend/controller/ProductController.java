package com.aal.erp_backend.controller;

import com.aal.erp_backend.dto.ApiResponse;
import com.aal.erp_backend.entity.Product;
import com.aal.erp_backend.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Product>>> getProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean active) {

        Page<Product> productPage = productService.getProducts(page, limit, search, category, active);
        ApiResponse.PaginationInfo pagination = new ApiResponse.PaginationInfo(
                page, limit, productPage.getTotalElements(), productPage.getTotalPages()
        );
        ApiResponse<Page<Product>> response = new ApiResponse<>(true, productPage, pagination);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProduct(@PathVariable UUID id) {
        Product product = productService.getProductById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, product));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Product>> createProduct(@RequestBody Product product) {
        Product created = productService.createProduct(product);
        return ResponseEntity.ok(new ApiResponse<>(true, created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> updateProduct(@PathVariable UUID id, @RequestBody Product product) {
        Product updated = productService.updateProduct(id, product);
        return ResponseEntity.ok(new ApiResponse<>(true, updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(new ApiResponse<>(true, null));
    }

    @GetMapping("/{id}/inventory")
    public ResponseEntity<ApiResponse<?>> getProductInventory(@PathVariable UUID id) {
        var inventory = productService.getProductInventory(id);
        return ResponseEntity.ok(new ApiResponse<>(true, inventory));
    }
}