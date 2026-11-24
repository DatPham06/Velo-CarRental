package com.velo.controller;

import com.velo.dto.response.AdminStatistics;
import com.velo.service.AccountSession;
import com.velo.service.StatisticsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/order")
public class StatisticsController {
    private final StatisticsService statistics;
    private final AccountSession sessions;

    public StatisticsController(StatisticsService statistics, AccountSession sessions) {
        this.statistics = statistics;
        this.sessions = sessions;
    }

    @GetMapping("/statistics")
    public AdminStatistics overview(@RequestParam(name = "year", required = false) Integer year,
                                     HttpServletRequest request) {
        sessions.requireAdmin(request);
        return statistics.overview(year);
    }
}
