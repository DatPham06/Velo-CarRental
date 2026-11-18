package com.velo.controller;

import com.velo.entity.ProductEntity;
import com.velo.service.ProductService;
import com.velo.service.AccountSession;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/product")
public class ProductController {
    private final ProductService productService;
    private final AccountSession sessions;

    public ProductController(ProductService productService, AccountSession sessions) {
        this.productService = productService;
        this.sessions = sessions;
    }

    @GetMapping("/getall")
    public List<ProductEntity> getAllProduct() {
        return productService.findAllProduct();
    }
    @GetMapping("/getbybrand/{brand}")
    public List<ProductEntity> getAllByBrand(@PathVariable("brand") String brand) {
        return productService.findAllByBrand(brand);
    }
    @PostMapping("/create")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductEntity createProduct(@RequestBody ProductEntity product, HttpServletRequest request) {
        sessions.requireAdmin(request);
        return productService.createProduct(product);
    }

    @PostMapping("/{id}/update")
    public ProductEntity updateProduct(@PathVariable("id") long id, @RequestBody ProductEntity product,
                                        HttpServletRequest request) {
        sessions.requireAdmin(request);
        return productService.updateProduct(id, product);
    }

    @PostMapping("/{id}/delete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable("id") long id, HttpServletRequest request) {
        sessions.requireAdmin(request);
        productService.deleteProduct(id);
    }

    @GetMapping("/getbyid/{id}")
    public ProductEntity getProductById(@PathVariable("id") long id) {
        return productService.findById(id);
    }

}
